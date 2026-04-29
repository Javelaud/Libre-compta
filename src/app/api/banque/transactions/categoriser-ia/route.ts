import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ResultSchema = z.object({
  affectations: z.array(
    z.object({
      id: z.string(),
      rubrique_code: z.string().nullable(),
      sens: z.enum(["RECETTE", "DEPENSE"]).nullable(),
      confiance: z.enum(["FAIBLE", "MOYENNE", "FORTE"]),
    })
  ),
});

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée dans .env" },
      { status: 500 }
    );
  }

  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const transactions = await prisma.transactionBancaire.findMany({
    where: { userId: user.id, statut: "A_CATEGORISER" },
    select: { id: true, libelleBancaire: true, montant: true, rubrique2035Code: true },
  });

  if (transactions.length === 0) {
    return NextResponse.json({ affectees: 0, total: 0, faibles: 0 });
  }

  const rubriques = await prisma.rubrique2035.findMany({ orderBy: { code: "asc" } });
  const codesValides = new Set(rubriques.map((r) => r.code));

  const catalogue = rubriques
    .map((r) => `- ${r.code} (${r.type}) : ${r.libelle}`)
    .join("\n");

  const systemPrompt = `Tu es un expert en comptabilité BNC française. Tu catégorises les transactions bancaires d'un professionnel libéral selon les rubriques du formulaire 2035.

CATALOGUE DES RUBRIQUES :
${catalogue}

CONNAISSANCES MÉTIER :
- URSSAF, CARPIMKO, CARMF, CAVEC, CIPAV, CNAVPL, CNBF, MSA, RSI → BW (charges sociales personnelles)
- Loyer cabinet, bail professionnel → BM (loyers et charges locatives)
- EDF, ENGIE, TOTAL ENERGIES, EAU, VEOLIA, GAZ → BR (chauffage, eau, gaz, électricité)
- ORANGE, SFR, FREE, BOUYGUES, LA POSTE (téléphonie/courrier) → BY (correspondance et téléphone)
- MACSF, AXA, ALLIANZ, GENERALI, MMA, MAAF, GROUPAMA, SWISS LIFE → BT (primes d'assurances)
- TOTAL, SHELL, ESSO, BP, INTERMARCHE STATION, AUCHAN STATION, CARBURANT, ESSENCE → BU (frais de véhicules)
- PEAGE, AUTOROUTE, VINCI, APRR, SANEF, PARKING → BU (frais de véhicules)
- SNCF, TGV, RATP, UBER, BLABLACAR → BV (autres frais de déplacement)
- HOTEL, AIRBNB, BOOKING, RESTAURANT, BRASSERIE → BX (frais de réception)
- AMAZON, FNAC, BUREAU VALLEE, OFFICE DEPOT → BG (achats) ou BQ (petit outillage) selon montant
- BNP, SOCIETE GENERALE, CREDIT AGRICOLE, LCL (frais), AGIOS, COMMISSION → CA (frais bancaires)
- ORDRE PROFESSIONNEL, COTISATION CONSEIL DE L'ORDRE → BL (autres impôts et taxes)
- COMPTABLE, EXPERT-COMPTABLE, AVOCAT honoraires → BS (honoraires rétrocédés) si rétrocession, sinon CB
- LOGICIEL, ABONNEMENT SAAS, MICROSOFT, GOOGLE, ADOBE → CB (frais divers de gestion)
- VIR, VRT, VIREMENT entrant (montant > 0) avec nom patient/client → BA (honoraires)
- IMPOTS, TAXE FONCIERE PRO, CFE, CVAE → BK (CET) ou BL (autres impôts)

RÈGLES STRICTES :
1. Analyse le libellé (souvent abrégé, ALL CAPS) et propose TOUJOURS la rubrique la plus probable.
2. CONTRAINTE ABSOLUE : montant > 0 → rubrique de type RECETTE OBLIGATOIREMENT (BA-BF). Montant < 0 → rubrique de type DEPENSE OBLIGATOIREMENT (BG-CE).
3. Le sens doit être strictement RECETTE pour montant > 0 et DEPENSE pour montant < 0.
4. PROPOSE UNE RUBRIQUE MÊME EN CAS D'INCERTITUDE — utilise les rubriques génériques quand tu hésites :
   - Recette inconnue (montant > 0) → BA (honoraires) par défaut, ou BD (gains divers)
   - Dépense inconnue (montant < 0) → CB (frais divers de gestion) par défaut, ou BG (achats) si ça ressemble à un achat
5. Confiance : FORTE (marque/nature claire) | MOYENNE (probable mais ambigu) | FAIBLE (incertain mais best guess).
6. Ne mets rubrique_code: null QUE si vraiment aucune rubrique ne peut s'appliquer (cas extrêmement rare — préfère toujours une rubrique générique avec confiance FAIBLE).
7. Utilise uniquement les codes du catalogue, jamais d'invention.
8. RÉPONDS UNIQUEMENT avec le schéma demandé. Classe TOUTES les transactions données — aucune omission.`;

  const client = new Anthropic();

  const BATCH_SIZE = 40;
  let affectees = 0;
  let faibles = 0;
  let rejetees = 0;

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);

    let result;
    try {
      const response = await client.messages.parse({
        model: "claude-haiku-4-5",
        max_tokens: 8000,
        output_config: { format: zodOutputFormat(ResultSchema) },
        system: [
          { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
        ],
        messages: [
          {
            role: "user",
            content: `Catégorise ces ${batch.length} transaction(s) :\n\n${batch
              .map((t) => `${t.id} | ${t.libelleBancaire} | ${t.montant} €`)
              .join("\n")}`,
          },
        ],
      });
      result = response.parsed_output;
    } catch (e) {
      console.error("[categoriser-ia] batch error:", e);
      continue;
    }

    if (!result) continue;

    for (const aff of result.affectations) {
      if (!aff.rubrique_code || !codesValides.has(aff.rubrique_code)) continue;
      const rub = rubriques.find((r) => r.code === aff.rubrique_code)!;

      // Trouve la transaction d'origine pour vérifier le sens vs montant
      const tx = batch.find((t) => t.id === aff.id);
      if (!tx) continue;

      // Contrainte stricte : montant > 0 ⇒ RECETTE seulement, montant < 0 ⇒ DEPENSE seulement
      const sensAttendu: "RECETTE" | "DEPENSE" = tx.montant >= 0 ? "RECETTE" : "DEPENSE";
      if (rub.type !== sensAttendu) {
        rejetees++;
        continue;
      }

      if (aff.confiance === "FAIBLE") faibles++;

      await prisma.transactionBancaire.update({
        where: { id: aff.id },
        data: {
          rubrique2035Code: aff.rubrique_code,
          sens: sensAttendu,
        },
      });
      affectees++;
    }
  }

  return NextResponse.json({
    affectees,
    total: transactions.length,
    faibles,
    rejetees,
  });
}
