import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculer2035 } from "@/lib/calculs2035";

async function resolveUser() {
  const user = await prisma.user.findFirst();
  return user;
}

export async function GET(request: NextRequest) {
  const annee = Number(request.nextUrl.searchParams.get("annee")) || new Date().getFullYear();
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const calcul = await calculer2035(user.id, annee);
  const declaration = await prisma.declaration2035.findUnique({
    where: { userId_annee: { userId: user.id, annee } },
  });

  return NextResponse.json({
    ...calcul,
    declaration: declaration
      ? { id: declaration.id, statut: declaration.statut, validatedAt: declaration.validatedAt }
      : null,
  });
}

export async function POST(request: NextRequest) {
  const annee = Number(request.nextUrl.searchParams.get("annee")) || new Date().getFullYear();
  const action = request.nextUrl.searchParams.get("action") ?? "validate";
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  if (action === "devalidate") {
    const updated = await prisma.declaration2035.update({
      where: { userId_annee: { userId: user.id, annee } },
      data: { statut: "BROUILLON", validatedAt: null },
    });
    return NextResponse.json(updated);
  }

  const calcul = await calculer2035(user.id, annee);
  const snapshot = JSON.stringify(calcul);

  const declaration = await prisma.declaration2035.upsert({
    where: { userId_annee: { userId: user.id, annee } },
    update: { statut: "VALIDEE", snapshot, validatedAt: new Date() },
    create: {
      userId: user.id,
      annee,
      statut: "VALIDEE",
      snapshot,
      validatedAt: new Date(),
    },
  });

  return NextResponse.json(declaration);
}
