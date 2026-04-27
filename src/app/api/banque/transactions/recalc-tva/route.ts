import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchMotsCles } from "@/lib/banque/matchMotsCles";

export async function POST(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode") ?? "all";
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const motsCles = await prisma.motCle.findMany({ where: { userId: user.id } });
  const transactions = await prisma.transactionBancaire.findMany({
    where: { userId: user.id, statut: "A_CATEGORISER" },
  });

  let recalculees = 0;
  let rubriquesChangees = 0;
  let tvaChangees = 0;

  for (const tx of transactions) {
    const match = matchMotsCles(tx.libelleBancaire, motsCles);
    if (!match) continue;

    const tvaNouvelle =
      match.tauxTVA > 0
        ? Math.round((Math.abs(tx.montant) * match.tauxTVA) / (100 + match.tauxTVA) * 100) / 100
        : 0;

    const data: {
      tva?: number;
      rubrique2035Code?: string;
      sens?: string;
    } = {};

    if (tvaNouvelle !== tx.tva) {
      data.tva = tvaNouvelle;
      tvaChangees++;
    }
    if (mode !== "tva" && (tx.rubrique2035Code !== match.rubrique2035Code || tx.sens !== match.sens)) {
      data.rubrique2035Code = match.rubrique2035Code;
      data.sens = match.sens;
      rubriquesChangees++;
    }

    if (Object.keys(data).length > 0) {
      await prisma.transactionBancaire.update({ where: { id: tx.id }, data });
      recalculees++;
    }
  }

  return NextResponse.json({
    recalculees,
    rubriquesChangees,
    tvaChangees,
    total: transactions.length,
  });
}
