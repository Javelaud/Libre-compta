import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — Valider la transaction → créer une écriture comptable
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const transaction = await prisma.transactionBancaire.findUnique({ where: { id } });
  if (!transaction) {
    return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 });
  }

  if (!transaction.rubrique2035Code || !transaction.sens) {
    return NextResponse.json(
      { error: "Rubrique et sens requis avant validation" },
      { status: 400 }
    );
  }

  const exercice = await prisma.exerciceFiscal.findFirst({
    where: { userId: transaction.userId, statut: "OUVERT" },
    orderBy: { annee: "desc" },
  });

  if (!exercice) {
    return NextResponse.json({ error: "Aucun exercice ouvert" }, { status: 400 });
  }

  const tvaAmount = transaction.tva ?? 0;
  const ecriture = await prisma.ecritureComptable.create({
    data: {
      exerciceId: exercice.id,
      date: transaction.date,
      libelle: transaction.libelleComptable || transaction.libelleBancaire,
      montant: Math.abs(transaction.montant),
      sens: transaction.sens,
      rubrique2035Code: transaction.rubrique2035Code,
      tvaCollectee: transaction.sens === "RECETTE" ? tvaAmount : 0,
      tvaDeductible: transaction.sens === "DEPENSE" ? tvaAmount : 0,
    },
  });

  await prisma.transactionBancaire.update({
    where: { id },
    data: { statut: "VALIDEE", ecritureId: ecriture.id },
  });

  return NextResponse.json({ success: true, ecritureId: ecriture.id });
}

// PATCH — Mettre à jour rubrique, libellé, sens, tva
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { rubrique2035Code, libelleComptable, sens, tva } = body;

  const updated = await prisma.transactionBancaire.update({
    where: { id },
    data: {
      ...(rubrique2035Code !== undefined && { rubrique2035Code }),
      ...(libelleComptable !== undefined && { libelleComptable }),
      ...(sens !== undefined && { sens }),
      ...(tva !== undefined && { tva: Number(tva) }),
    },
    include: { rubrique2035: true },
  });

  return NextResponse.json(updated);
}

// DELETE — Ignorer la transaction
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.transactionBancaire.update({
    where: { id },
    data: { statut: "IGNOREE" },
  });
  return NextResponse.json({ success: true });
}
