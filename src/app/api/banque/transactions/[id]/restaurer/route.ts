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
  if (transaction.statut !== "IGNOREE") {
    return NextResponse.json({ error: "Transaction non ignorée" }, { status: 400 });
  }
  await prisma.transactionBancaire.update({
    where: { id },
    data: { statut: "A_CATEGORISER" },
  });
  return NextResponse.json({ success: true });
}
