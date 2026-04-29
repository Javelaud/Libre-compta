import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { ids } = (await request.json()) as { ids?: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids requis" }, { status: 400 });
  }

  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const transactions = await prisma.transactionBancaire.findMany({
    where: { id: { in: ids }, userId: user.id, statut: "A_CATEGORISER" },
  });

  let validees = 0;
  const skipped: string[] = [];

  for (const tx of transactions) {
    if (!tx.rubrique2035Code || !tx.sens) {
      skipped.push(tx.id);
      continue;
    }

    const anneeTx = tx.date.getFullYear();
    const exercice = await prisma.exerciceFiscal.upsert({
      where: { userId_annee: { userId: tx.userId, annee: anneeTx } },
      update: {},
      create: {
        userId: tx.userId,
        annee: anneeTx,
        dateDebut: new Date(`${anneeTx}-01-01`),
        dateFin: new Date(`${anneeTx}-12-31`),
      },
    });

    const tvaAmount = tx.tva ?? 0;
    const ecriture = await prisma.ecritureComptable.create({
      data: {
        exerciceId: exercice.id,
        date: tx.date,
        libelle: tx.libelleComptable || tx.libelleBancaire,
        montant: Math.abs(tx.montant),
        sens: tx.sens,
        rubrique2035Code: tx.rubrique2035Code,
        tvaCollectee: tx.sens === "RECETTE" ? tvaAmount : 0,
        tvaDeductible: tx.sens === "DEPENSE" ? tvaAmount : 0,
      },
    });

    await prisma.transactionBancaire.update({
      where: { id: tx.id },
      data: { statut: "VALIDEE", ecritureId: ecriture.id },
    });

    validees++;
  }

  return NextResponse.json({ validees, skipped: skipped.length });
}
