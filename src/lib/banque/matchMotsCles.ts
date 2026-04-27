type MotCle = {
  motCle: string;
  rubrique2035Code: string;
  sens: string;
  tauxTVA: number;
};

type MatchResult = {
  rubrique2035Code: string;
  sens: string;
  motCle: string;
  tauxTVA: number;
} | null;

export function matchMotsCles(libelleBancaire: string, motsCles: MotCle[]): MatchResult {
  const normalized = libelleBancaire.toUpperCase();

  for (const mc of motsCles) {
    if (normalized.includes(mc.motCle.toUpperCase())) {
      return {
        rubrique2035Code: mc.rubrique2035Code,
        sens: mc.sens,
        motCle: mc.motCle,
        tauxTVA: mc.tauxTVA,
      };
    }
  }

  return null;
}
