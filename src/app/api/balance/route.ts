import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const exerciceId = searchParams.get("exerciceId");

  if (!exerciceId) {
    return NextResponse.json({ error: "exerciceId requis" }, { status: 400 });
  }

  const ecritures = await prisma.ecritureComptable.findMany({
    where: { exerciceId },
    include: { rubrique2035: true },
  });

  // Agréger par rubrique
  const rubriquesMap: Record<
    string,
    {
      code: string;
      libelle: string;
      type: string;
      totalRecettes: number;
      totalDepenses: number;
      nbEcritures: number;
    }
  > = {};

  for (const e of ecritures) {
    const code = e.rubrique2035Code;
    if (!rubriquesMap[code]) {
      rubriquesMap[code] = {
        code,
        libelle: e.rubrique2035.libelle,
        type: e.rubrique2035.type,
        totalRecettes: 0,
        totalDepenses: 0,
        nbEcritures: 0,
      };
    }
    rubriquesMap[code].nbEcritures++;
    if (e.sens === "RECETTE") {
      rubriquesMap[code].totalRecettes += e.montant;
    } else {
      rubriquesMap[code].totalDepenses += e.montant;
    }
  }

  const lignes = Object.values(rubriquesMap).sort((a, b) =>
    a.code.localeCompare(b.code)
  );

  const totalRecettes = lignes.reduce((s, l) => s + l.totalRecettes, 0);
  const totalDepenses = lignes.reduce((s, l) => s + l.totalDepenses, 0);

  return NextResponse.json({
    lignes,
    totalRecettes,
    totalDepenses,
    solde: totalRecettes - totalDepenses,
  });
}
