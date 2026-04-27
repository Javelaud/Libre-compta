import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ecritureSchema } from "@/lib/validations/ecriture";

// GET — Liste des écritures de l'exercice courant
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const exerciceId = searchParams.get("exerciceId");
  const sens = searchParams.get("sens");

  if (!exerciceId) {
    return NextResponse.json(
      { error: "exerciceId requis" },
      { status: 400 }
    );
  }

  const where: Record<string, unknown> = { exerciceId };
  if (sens === "RECETTE" || sens === "DEPENSE") {
    where.sens = sens;
  }

  const ecritures = await prisma.ecritureComptable.findMany({
    where,
    include: { rubrique2035: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(ecritures);
}

// POST — Créer une écriture
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = ecritureSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { date, ...rest } = parsed.data;

  // Vérifier qu'un exercice existe pour cette écriture
  const exerciceId = request.nextUrl.searchParams.get("exerciceId");
  if (!exerciceId) {
    return NextResponse.json(
      { error: "exerciceId requis" },
      { status: 400 }
    );
  }

  const ecriture = await prisma.ecritureComptable.create({
    data: {
      ...rest,
      date: new Date(date),
      exerciceId,
    },
    include: { rubrique2035: true },
  });

  return NextResponse.json(ecriture, { status: 201 });
}
