import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const exerciceId = request.nextUrl.searchParams.get("exerciceId");
  if (!exerciceId) {
    return NextResponse.json({ error: "exerciceId requis" }, { status: 400 });
  }

  const ecritures = await prisma.ecritureComptable.findMany({
    where: { exerciceId },
    orderBy: { date: "asc" },
  });

  // Agréger par mois
  const moisMap: Record<string, { mois: string; recettes: number; depenses: number }> = {};

  for (const e of ecritures) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!moisMap[key]) {
      const label = d.toLocaleDateString("fr-FR", { month: "short" });
      moisMap[key] = { mois: label, recettes: 0, depenses: 0 };
    }
    if (e.sens === "RECETTE") {
      moisMap[key].recettes += e.montant;
    } else {
      moisMap[key].depenses += e.montant;
    }
  }

  // Retourner les 12 mois de l'année (même ceux sans écritures)
  const exercice = await prisma.exerciceFiscal.findUnique({ where: { id: exerciceId } });
  const annee = exercice?.annee ?? new Date().getFullYear();
  const result = [];

  for (let m = 0; m < 12; m++) {
    const key = `${annee}-${String(m + 1).padStart(2, "0")}`;
    const label = new Date(annee, m).toLocaleDateString("fr-FR", { month: "short" });
    result.push(moisMap[key] ?? { mois: label, recettes: 0, depenses: 0 });
  }

  return NextResponse.json(result);
}
