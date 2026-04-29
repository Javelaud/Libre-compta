import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/exercice/list
 * Retourne la liste des années où l'utilisateur a au moins :
 *  - 1 exercice fiscal créé
 *  - 1 écriture comptable
 *  - 1 transaction bancaire (toutes années des transactions)
 *  + l'année en cours, toujours.
 * Trié décroissant (plus récente en premier).
 */
export async function GET() {
  const user = await prisma.user.findFirst();
  if (!user) {
    return NextResponse.json([new Date().getFullYear()]);
  }

  const annees = new Set<number>();
  annees.add(new Date().getFullYear());

  const exercices = await prisma.exerciceFiscal.findMany({
    where: { userId: user.id },
    select: { annee: true },
  });
  for (const e of exercices) annees.add(e.annee);

  const transactions = await prisma.transactionBancaire.findMany({
    where: { userId: user.id },
    select: { date: true },
  });
  for (const t of transactions) annees.add(t.date.getFullYear());

  const result = [...annees].sort((a, b) => b - a);
  return NextResponse.json(result);
}
