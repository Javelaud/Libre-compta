import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json([], { status: 401 });

  const motsCles = await prisma.motCle.findMany({
    where: { userId: user.id },
    include: { rubrique2035: true },
    orderBy: { motCle: "asc" },
  });

  return NextResponse.json(motsCles);
}

export async function POST(request: NextRequest) {
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await request.json();
  const { motCle, rubrique2035Code, sens, tauxTVA } = body;

  const motCleNorm = typeof motCle === "string" ? motCle.trim().replace(/\s+/g, " ").toUpperCase() : "";
  if (!motCleNorm || !rubrique2035Code || !sens) {
    return NextResponse.json({ error: "Champs requis: motCle, rubrique2035Code, sens" }, { status: 400 });
  }

  try {
    const created = await prisma.motCle.create({
      data: {
        userId: user.id,
        motCle: motCleNorm,
        rubrique2035Code,
        sens,
        tauxTVA: Number(tauxTVA) || 0,
      },
      include: { rubrique2035: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "P2002") {
      return NextResponse.json({ error: `Le mot-clé "${motCleNorm}" existe déjà.` }, { status: 409 });
    }
    throw e;
  }
}
