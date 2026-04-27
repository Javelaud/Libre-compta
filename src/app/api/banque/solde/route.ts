import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const compte = await prisma.compteBancaire.findFirst({ where: { userId: user.id } });
  return NextResponse.json(compte ?? { solde: 0, nom: "—" });
}

export async function PATCH(request: NextRequest) {
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await request.json();
  const { solde, nom } = body;

  let compte = await prisma.compteBancaire.findFirst({ where: { userId: user.id } });

  if (compte) {
    compte = await prisma.compteBancaire.update({
      where: { id: compte.id },
      data: {
        ...(solde !== undefined && { solde: Number(solde) }),
        ...(nom !== undefined && { nom }),
      },
    });
  } else {
    compte = await prisma.compteBancaire.create({
      data: { userId: user.id, nom: nom || "Compte professionnel", solde: Number(solde) || 0 },
    });
  }

  return NextResponse.json(compte);
}
