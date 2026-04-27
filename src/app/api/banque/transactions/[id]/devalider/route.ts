import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const transaction = await prisma.transactionBancaire.findUnique({ where: { id } });
  if (!transaction) {
    return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 });
  }
  if (transaction.statut !== "VALIDEE") {
    return NextResponse.json({ error: "Transaction non validée" }, { status: 400 });
  }

  if (transaction.ecritureId) {
    await prisma.ecritureComptable
      .delete({ where: { id: transaction.ecritureId } })
      .catch(() => null);
  }

  await prisma.transactionBancaire.update({
    where: { id },
    data: { statut: "A_CATEGORISER", ecritureId: null },
  });

  return NextResponse.json({ success: true });
}
