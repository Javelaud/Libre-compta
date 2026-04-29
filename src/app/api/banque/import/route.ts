import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseRelevéBancaire } from "@/lib/banque/parseReleve";
import { matchMotsCles } from "@/lib/banque/matchMotsCles";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  // Trouver l'utilisateur (dev: premier utilisateur)
  const user = await prisma.user.findFirst();
  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 401 });
  }

  // Parser le fichier (XLSX ou CSV — détecté automatiquement par SheetJS)
  const buffer = await file.arrayBuffer();
  const transactions = await parseRelevéBancaire(buffer);
  if (transactions.length === 0) {
    return NextResponse.json({ error: "Aucune transaction trouvée dans le fichier" }, { status: 400 });
  }

  // Charger les mots-clés de l'utilisateur
  const motsCles = await prisma.motCle.findMany({ where: { userId: user.id } });

  let importees = 0;
  let matchees = 0;
  let doublons = 0;

  for (const t of transactions) {
    // Vérifier les doublons (même date + même montant + même libellé)
    const existing = await prisma.transactionBancaire.findFirst({
      where: {
        userId: user.id,
        date: t.date,
        montant: t.montant,
        libelleBancaire: t.libelle,
      },
    });

    if (existing) {
      doublons++;
      continue;
    }

    // Détecter le sens automatiquement
    const sensAuto = t.montant > 0 ? "RECETTE" : "DEPENSE";

    // Chercher un mot-clé correspondant
    const match = matchMotsCles(t.libelle, motsCles);

    // Calculer la TVA automatiquement si le mot-clé a un taux
    let tvaAuto = 0;
    if (match?.tauxTVA && match.tauxTVA > 0) {
      tvaAuto = Math.round(Math.abs(t.montant) * match.tauxTVA / (100 + match.tauxTVA) * 100) / 100;
    }

    await prisma.transactionBancaire.create({
      data: {
        userId: user.id,
        date: t.date,
        libelleBancaire: t.libelle,
        montant: t.montant,
        tva: tvaAuto,
        sens: match?.sens ?? sensAuto,
        rubrique2035Code: match?.rubrique2035Code ?? null,
        libelleComptable: t.libelle,
      },
    });

    importees++;
    if (match) matchees++;
  }

  return NextResponse.json({ importees, matchees, doublons });
}
