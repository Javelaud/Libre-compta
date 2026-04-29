import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { ids } = (await request.json()) as { ids?: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids requis" }, { status: 400 });
  }

  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  // Récupère les transactions ciblées (et leurs ecritureId si validées)
  const transactions = await prisma.transactionBancaire.findMany({
    where: { id: { in: ids }, userId: user.id },
    select: { id: true, ecritureId: true },
  });

  const ecritureIds = transactions
    .map((t) => t.ecritureId)
    .filter((id): id is string => !!id);

  // Supprime d'abord les écritures liées (validées) puis les transactions
  if (ecritureIds.length > 0) {
    await prisma.ecritureComptable.deleteMany({ where: { id: { in: ecritureIds } } });
  }
  const deleted = await prisma.transactionBancaire.deleteMany({
    where: { id: { in: transactions.map((t) => t.id) } },
  });

  return NextResponse.json({ deleted: deleted.count });
}
