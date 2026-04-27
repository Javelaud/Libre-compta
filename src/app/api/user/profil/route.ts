import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    // En dev, retourner le premier utilisateur
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    return NextResponse.json(user);
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
  });

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let userId: string;

  if (session?.user) {
    userId = (session.user as { id: string }).id;
  } else {
    // En dev, utiliser le premier utilisateur
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    userId = user.id;
  }

  const body = await request.json();
  const { nom, siret, profession, regimeTVA, tauxTVA } = body;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(nom !== undefined && { nom }),
      ...(siret !== undefined && { siret: siret || null }),
      ...(profession !== undefined && { profession: profession || null }),
      ...(regimeTVA !== undefined && { regimeTVA }),
      ...(tauxTVA !== undefined && { tauxTVA: Number(tauxTVA) }),
    },
  });

  return NextResponse.json(updated);
}
