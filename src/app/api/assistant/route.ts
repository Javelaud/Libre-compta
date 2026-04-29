import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { calculer2035 } from "@/lib/calculs2035";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

async function buildSystemPrompt() {
  const user = await prisma.user.findFirst();
  if (!user) return null;

  const annee = new Date().getFullYear();
  const calcul = await calculer2035(user.id, annee);

  const compte = await prisma.compteBancaire.findFirst({ where: { userId: user.id } });
  const aCategorize = await prisma.transactionBancaire.count({
    where: { userId: user.id, statut: "A_CATEGORISER" },
  });

  const exercice = await prisma.exerciceFiscal.findUnique({
    where: { userId_annee: { userId: user.id, annee } },
  });
  const ecritures = exercice
    ? await prisma.ecritureComptable.findMany({
        where: { exerciceId: exercice.id },
        include: { rubrique2035: true },
        orderBy: { date: "desc" },
        take: 20,
      })
    : [];

  const rubByCode = Object.fromEntries(calcul.rubriques.map((r) => [r.code, r.libelle]));
  const totalRecettes = calcul.recettes.totalRecettes;
  const totalDepenses = calcul.depenses.totalDepenses;
  const net = totalRecettes - totalDepenses;

  const rubriquesNonNulles = [
    ...calcul.rubriques.filter((r) => r.type === "RECETTE").map((r) => ({
      code: r.code,
      libelle: r.libelle,
      total: (calcul.recettes as Record<string, number>)[r.code] ?? 0,
    })),
    ...calcul.rubriques.filter((r) => r.type === "DEPENSE").map((r) => ({
      code: r.code,
      libelle: r.libelle,
      total: (calcul.depenses as Record<string, number>)[r.code] ?? 0,
    })),
  ].filter((r) => r.total > 0);

  const detailRubriques = rubriquesNonNulles.length
    ? rubriquesNonNulles.map((r) => `- ${r.code} (${r.libelle}) : ${fmt(r.total)}`).join("\n")
    : "(aucune écriture pour cet exercice)";

  const dernieresEcritures = ecritures.length
    ? ecritures
        .map(
          (e) =>
            `${fmtDate(e.date)} | ${e.libelle} | ${e.rubrique2035Code} ${rubByCode[e.rubrique2035Code] ?? ""} | ${e.sens === "DEPENSE" ? "-" : "+"}${fmt(e.montant)}`
        )
        .join("\n")
    : "(aucune écriture saisie)";

  return `Tu es un assistant comptable expert pour les professions libérales françaises en régime BNC (déclaration contrôlée).
Tu as accès aux données comptables réelles de l'utilisateur pour l'exercice ${annee}.

DONNÉES COMPTABLES EN TEMPS RÉEL :
- Contribuable : ${user.nom}, ${user.profession ?? "profession non renseignée"}, SIRET : ${user.siret ?? "non renseigné"}
- Exercice : ${annee}
- Total recettes : ${fmt(totalRecettes)}
- Total dépenses : ${fmt(totalDepenses)}
- Résultat net : ${fmt(net)} (${net >= 0 ? "bénéfice" : "déficit"})
- Solde bancaire : ${fmt(compte?.solde ?? 0)}
- Transactions à catégoriser : ${aCategorize}

DÉTAIL PAR RUBRIQUE 2035 (rubriques non nulles uniquement) :
${detailRubriques}

DERNIÈRES ÉCRITURES (20 plus récentes) :
${dernieresEcritures}

Réponds toujours en français, de façon concise et précise.
Pour les montants, utilise le format français (ex: 1 234,56 €).
Si on te demande une analyse, propose des observations pertinentes pour un professionnel libéral.
Tu peux suggérer des optimisations fiscales légales adaptées au régime BNC.
Ne réponds qu'aux questions liées à la comptabilité, fiscalité et finances professionnelles.`;
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY non configurée dans .env" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages } = (await request.json()) as { messages: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages requis" }), { status: 400 });
  }

  const system = await buildSystemPrompt();
  if (!system) {
    return new Response(JSON.stringify({ error: "Utilisateur introuvable" }), { status: 401 });
  }

  const client = new Anthropic();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiStream = client.messages.stream({
          model: "claude-haiku-4-5",
          max_tokens: 1024,
          system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        apiStream.on("text", (delta: string) => {
          controller.enqueue(encoder.encode(delta));
        });

        await apiStream.finalMessage();
        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        controller.enqueue(encoder.encode(`\n\n[Erreur : ${msg}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Accel-Buffering": "no" },
  });
}
