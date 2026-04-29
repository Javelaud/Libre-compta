import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const statut = searchParams.get("statut") || "A_CATEGORISER";
  const mois = searchParams.get("mois");
  const annee = searchParams.get("annee");
  const search = searchParams.get("q");

  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json([], { status: 401 });

  const where: Record<string, unknown> = { userId: user.id, statut };

  if (mois) {
    const [a, m] = mois.split("-").map(Number);
    where.date = {
      gte: new Date(a, m - 1, 1),
      lt: new Date(a, m, 1),
    };
  } else if (annee) {
    const a = Number(annee);
    where.date = {
      gte: new Date(a, 0, 1),
      lt: new Date(a + 1, 0, 1),
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
