import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { ids } = (await request.json()) as { ids?: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids requis" }, { status: 400 });
  }

  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const result = await prisma.transactionBancaire.updateMany({
    where: { id: { in: ids }, userId: user.id, statut: "IGNOREE" },
    data: { statut: "A_CATEGORISER" },
  });

  return NextResponse.json({ restored: result.count });
}
