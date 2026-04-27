import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ count: 0 });

  const count = await prisma.transactionBancaire.count({
    where: { userId: user.id, statut: "A_CATEGORISER" },
  });

  return NextResponse.json({ count });
}
