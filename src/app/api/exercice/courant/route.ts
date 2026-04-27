import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET — Retourne l'exercice courant (ou en crée un pour l'année en cours en dev).
 * Sera sécurisé avec la session utilisateur en Session 6.
 */
export async function GET() {
  const annee = new Date().getFullYear();

  // Chercher un exercice ouvert pour l'année en cours
  let exercice = await prisma.exerciceFiscal.findFirst({
    where: { annee, statut: "OUVERT" },
  });

  // En dev : créer automatiquement un exercice + un utilisateur demo si besoin
  if (!exercice && process.env.NODE_ENV === "development") {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "demo@libre-compta.fr",
          nom: "Utilisateur Démo",
          profession: "Profession libérale",
        },
      });
    }

    exercice = await prisma.exerciceFiscal.create({
      data: {
        userId: user.id,
        annee,
        dateDebut: new Date(`${annee}-01-01`),
        dateFin: new Date(`${annee}-12-31`),
      },
    });
  }

  if (!exercice) {
    return NextResponse.json({ error: "Aucun exercice trouvé" }, { status: 404 });
  }

  return NextResponse.json(exercice);
}
