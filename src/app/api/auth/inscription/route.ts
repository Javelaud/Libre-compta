import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { inscriptionSchema } from "@/lib/validations/inscription";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = inscriptionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { email, password, nom, profession, siret } = parsed.data;

  // Vérifier si l'email est déjà utilisé
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email" },
      { status: 409 }
    );
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);

  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      nom,
      profession,
      siret: siret || null,
    },
  });

  // Créer l'exercice fiscal de l'année en cours
  const annee = new Date().getFullYear();
  await prisma.exerciceFiscal.create({
    data: {
      userId: user.id,
      annee,
      dateDebut: new Date(`${annee}-01-01`),
      dateFin: new Date(`${annee}-12-31`),
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
