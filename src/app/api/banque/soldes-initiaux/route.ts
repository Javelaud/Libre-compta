import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getCompte(userId: string) {
  let compte = await prisma.compteBancaire.findFirst({ where: { userId } });
  if (!compte) {
    compte = await prisma.compteBancaire.create({
      data: { userId, nom: "Compte professionnel" },
    });
  }
  return compte;
}

/**
 * GET /api/banque/soldes-initiaux
 * Retourne pour chaque année ayant ≥1 transaction (+ année en cours) :
 *   { annee, montant: number | null }
 * Trié décroissant.
 */
export async function GET() {
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json([], { status: 401 });

  const compte = await getCompte(user.id);

  const transactions = await prisma.transactionBancaire.findMany({
    where: { userId: user.id },
    select: { date: true },
  });
  const anneesTx = new Set<number>(transactions.map((t) => t.date.getFullYear()));
  anneesTx.add(new Date().getFullYear());

  const soldesExistants = await prisma.soldeInitial.findMany({
    where: { compteBancaireId: compte.id },
  });
  const map = new Map(soldesExistants.map((s) => [s.annee, s.montant]));

  // Toutes les années des soldes saisis sont aussi incluses (ex : si l'utilisateur
  // a saisi 2020 mais n'a pas encore de transaction 2020)
  for (const s of soldesExistants) anneesTx.add(s.annee);

  const result = [...anneesTx]
    .sort((a, b) => b - a)
    .map((annee) => ({
      annee,
      montant: map.has(annee) ? map.get(annee)! : null,
    }));

  return NextResponse.json(result);
}

/**
 * POST /api/banque/soldes-initiaux
 * Body : { annee: number, montant: number }
 * Upsert sur (compteBancaireId, annee).
 */
export async function POST(request: NextRequest) {
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await request.json();
  const annee = Number(body?.annee);
  const montant = Number(body?.montant);

  if (!Number.isInteger(annee) || annee < 2000 || annee > 2100) {
    return NextResponse.json({ error: "Année invalide" }, { status: 400 });
  }
  if (!Number.isFinite(montant)) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  const compte = await getCompte(user.id);

  const solde = await prisma.soldeInitial.upsert({
    where: { compteBancaireId_annee: { compteBancaireId: compte.id, annee } },
    update: { montant },
    create: { compteBancaireId: compte.id, annee, montant },
  });

  return NextResponse.json(solde);
}
