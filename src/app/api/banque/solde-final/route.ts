import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/banque/solde-final?annee=N
 * Retourne le solde calculé en fin d'exercice N :
 *   solde_initial(N) + Σ transactions de l'année N
 * Renvoie null si aucun solde initial n'a été saisi pour N (et aucune transaction).
 */
export async function GET(request: NextRequest) {
  const annee = Number(request.nextUrl.searchParams.get("annee"));
  if (!Number.isInteger(annee)) {
    return NextResponse.json({ error: "annee requis" }, { status: 400 });
  }

  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const compte = await prisma.compteBancaire.findFirst({ where: { userId: user.id } });
  if (!compte) {
    return NextResponse.json({ annee, soldeInitial: null, soldeFinal: null });
  }

  const soldeInit = await prisma.soldeInitial.findUnique({
    where: { compteBancaireId_annee: { compteBancaireId: compte.id, annee } },
  });

  const debut = new Date(annee, 0, 1);
  const fin = new Date(annee + 1, 0, 1);
  const transactions = await prisma.transactionBancaire.findMany({
    where: { userId: user.id, date: { gte: debut, lt: fin } },
    select: { montant: true },
  });
  const sumMouvements = transactions.reduce((s, t) => s + t.montant, 0);

  // Si aucun solde initial saisi ET aucune transaction, on renvoie null
  if (!soldeInit && transactions.length === 0) {
    return NextResponse.json({ annee, soldeInitial: null, soldeFinal: null });
  }

  const soldeInitMontant = soldeInit?.montant ?? null;
  const soldeFinal = (soldeInit?.montant ?? 0) + sumMouvements;

  return NextResponse.json({
    annee,
    soldeInitial: soldeInitMontant,
    soldeFinal,
    nbTransactions: transactions.length,
  });
}
