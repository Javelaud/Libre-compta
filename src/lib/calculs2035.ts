import { prisma } from "@/lib/prisma";

export type CodeRecette = "BA" | "BB" | "BC" | "BD" | "BE" | "BF";
export type CodeDepense =
  | "BG" | "BH" | "BI" | "BJ" | "BK" | "BL" | "BM" | "BN" | "BO"
  | "BP" | "BQ" | "BR" | "BS" | "BT" | "BU" | "BV" | "BW" | "BX"
  | "BY" | "BZ" | "CA" | "CB" | "CC" | "CD" | "CE";

const CODES_RECETTES: CodeRecette[] = ["BA", "BB", "BC", "BD", "BE", "BF"];
const CODES_DEPENSES: CodeDepense[] = [
  "BG", "BH", "BI", "BJ", "BK", "BL", "BM", "BN", "BO",
  "BP", "BQ", "BR", "BS", "BT", "BU", "BV", "BW", "BX",
  "BY", "BZ", "CA", "CB", "CC", "CD", "CE",
];

export type Calcul2035 = {
  recettes: Record<CodeRecette, number> & { totalRecettes: number };
  depenses: Record<CodeDepense, number> & { totalDepenses: number };
  resultat: { beneficeNet: number; deficitNet: number; estBeneficiaire: boolean };
  contribuable: {
    nom: string;
    prenom: string;
    siret: string;
    profession: string;
    adresse: string;
    annee: number;
  };
  rubriques: { code: string; libelle: string; type: string }[];
};

export async function calculer2035(userId: string, annee: number): Promise<Calcul2035> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error(`Utilisateur ${userId} introuvable`);

  const exercice = await prisma.exerciceFiscal.findUnique({
    where: { userId_annee: { userId, annee } },
  });

  const ecritures = exercice
    ? await prisma.ecritureComptable.findMany({ where: { exerciceId: exercice.id } })
    : [];

  const recettes = Object.fromEntries(CODES_RECETTES.map((c) => [c, 0])) as Record<CodeRecette, number>;
  const depenses = Object.fromEntries(CODES_DEPENSES.map((c) => [c, 0])) as Record<CodeDepense, number>;

  for (const e of ecritures) {
    if (e.sens === "RECETTE" && CODES_RECETTES.includes(e.rubrique2035Code as CodeRecette)) {
      recettes[e.rubrique2035Code as CodeRecette] += e.montant;
    } else if (e.sens === "DEPENSE" && CODES_DEPENSES.includes(e.rubrique2035Code as CodeDepense)) {
      depenses[e.rubrique2035Code as CodeDepense] += e.montant;
    }
  }

  const totalRecettes = Object.values(recettes).reduce((s, v) => s + v, 0);
  const totalDepenses = Object.values(depenses).reduce((s, v) => s + v, 0);
  const net = totalRecettes - totalDepenses;

  const rubriques = await prisma.rubrique2035.findMany({ orderBy: { code: "asc" } });

  return {
    recettes: { ...recettes, totalRecettes },
    depenses: { ...depenses, totalDepenses },
    resultat: {
      beneficeNet: net > 0 ? net : 0,
      deficitNet: net < 0 ? -net : 0,
      estBeneficiaire: net >= 0,
    },
    contribuable: {
      nom: user.nom,
      prenom: "",
      siret: user.siret ?? "",
      profession: user.profession ?? "",
      adresse: "",
      annee,
    },
    rubriques: rubriques.map((r) => ({ code: r.code, libelle: r.libelle, type: r.type })),
  };
}
