import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE — Supprimer une écriture
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.ecritureComptable.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
