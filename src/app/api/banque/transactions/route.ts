import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const statut = searchParams.get("statut") || "A_CATEGORISER";
  const mois = searchParams.get("mois");
  const search = searchParams.get("q");

  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json([], { status: 401 });

  const where: Record<string, unknown> = { userId: user.id, statut };

  if (mois) {
    const [annee, m] = mois.split("-").map(Number);
    where.date = {
      gte: new Date(annee, m - 1, 1),
      lt: new Date(annee, m, 1),
    };
  }

  if (search) {
    where.libelleBancaire = { contains: search };
  }

  const transactions = await prisma.transactionBancaire.findMany({
    where,
    include: { rubrique2035: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}
