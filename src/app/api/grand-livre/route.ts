import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const exerciceId = searchParams.get("exerciceId");
  const sens = searchParams.get("sens");
  const mois = searchParams.get("mois");
  const rubrique = searchParams.get("rubrique");
  const dateDebut = searchParams.get("dateDebut");
  const dateFin = searchParams.get("dateFin");

  if (!exerciceId) {
    return NextResponse.json({ error: "exerciceId requis" }, { status: 400 });
  }

  const where: Record<string, unknown> = { exerciceId };

  if (sens === "RECETTE" || sens === "DEPENSE") {
    where.sens = sens;
  }

  if (rubrique) {
    where.rubrique2035Code = rubrique;
  }

  if (mois) {
    const [annee, m] = mois.split("-").map(Number);
    where.date = {
      gte: new Date(annee, m - 1, 1),
      lt: new Date(annee, m, 1),
    };
  } else if (dateDebut || dateFin) {
    const dateFilter: Record<string, Date> = {};
    if (dateDebut) dateFilter.gte = new Date(dateDebut);
    if (dateFin) dateFilter.lte = new Date(dateFin);
    where.date = dateFilter;
  }

  const ecritures = await prisma.ecritureComptable.findMany({
    where,
    include: { rubrique2035: true },
    orderBy: [{ rubrique2035Code: "asc" }, { date: "asc" }],
  });

  // Grouper par rubrique avec solde cumulé
  const groupes: Record<
    string,
    {
      code: string;
      libelle: string;
      type: string;
      ecritures: {
        id: string;
        date: string;
        libelle: string;
        montant: number;
        sens: string;
        pieceRef: string | null;
        debit: number;
        credit: number;
        soldeCumule: number;
      }[];
      totalDebit: number;
      totalCredit: number;
    }
  > = {};

  for (const e of ecritures) {
    const code = e.rubrique2035Code;
    if (!groupes[code]) {
      groupes[code] = {
        code,
        libelle: e.rubrique2035.libelle,
        type: e.rubrique2035.type,
        ecritures: [],
        totalDebit: 0,
        totalCredit: 0,
      };
    }

    const debit = e.sens === "DEPENSE" ? e.montant : 0;
    const credit = e.sens === "RECETTE" ? e.montant : 0;
    groupes[code].totalDebit += debit;
    groupes[code].totalCredit += credit;

    const prevSolde =
      groupes[code].ecritures.length > 0
        ? groupes[code].ecritures[groupes[code].ecritures.length - 1].soldeCumule
        : 0;

    groupes[code].ecritures.push({
      id: e.id,
      date: e.date.toISOString(),
      libelle: e.libelle,
      montant: e.montant,
      sens: e.sens,
      pieceRef: e.pieceRef,
      debit,
      credit,
      soldeCumule: prevSolde + credit - debit,
    });
  }

  const result = Object.values(groupes).sort((a, b) =>
    a.code.localeCompare(b.code)
  );

  return NextResponse.json(result);
}
