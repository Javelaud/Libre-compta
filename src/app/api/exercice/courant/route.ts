import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET — Retourne (ou crée) un exercice fiscal pour l'année donnée (?annee=N),
 * ou pour l'année en cours si non précisée.
 */
export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get("annee");
  const annee = param ? Number(param) : new Date().getFullYear();
  if (!Number.isInteger(annee) || annee < 2000 || annee > 2100) {
    return NextResponse.json({ error: "Année invalide" }, { status: 400 });
  }

  // Trouver l'utilisateur (en dev : premier user, créé si absent)
  let user = await prisma.user.findFirst();
  if (!user && process.env.NODE_ENV === "development") {
    user = await prisma.user.create({
      data: {
        email: "demo@libre-compta.fr",
        nom: "Utilisateur Démo",
        profession: "Profession libérale",
      },
    });
  }
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
  }

  // Chercher l'exercice pour cette année
  let exercice = await prisma.exerciceFiscal.findUnique({
    where: { userId_annee: { userId: user.id, annee } },
  });

  if (!exercice) {
    exercice = await prisma.exerciceFiscal.create({
      data: {
        userId: user.id,
        annee,
        dateDebut: new Date(`${annee}-01-01`),
        dateFin: new Date(`${annee}-12-31`),
      },
    });
  }

  return NextResponse.json(exercice);
}
