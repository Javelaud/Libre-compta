/**
 * Catégorisation automatique des écritures vers les rubriques 2035 officielles.
 * Codes BA→BF (recettes), BG→CE (dépenses).
 */

type Rule = {
  keywords: string[];
  code: string;
  sens: "RECETTE" | "DEPENSE";
};

const rules: Rule[] = [
  // ─── RECETTES ──────────────────────────────────────────
  { keywords: ["honoraire", "consultation", "acte", "soin", "séance", "vacation", "mission", "prestation"], code: "BA", sens: "RECETTE" },
  { keywords: ["rétrocession reçue", "débours", "avance client", "collaboration"], code: "BB", sens: "RECETTE" },
  { keywords: ["revenu accessoire", "formation dispensée", "enseignement", "expertise"], code: "BC", sens: "RECETTE" },
  { keywords: ["indemnité", "remboursement", "subvention", "aide", "gain"], code: "BD", sens: "RECETTE" },

  // ─── DEPENSES ──────────────────────────────────────────
  { keywords: ["achat", "fourniture médicale", "matériel médical", "pharmacie", "réactif"], code: "BG", sens: "DEPENSE" },
  { keywords: ["salaire", "paie", "rémunération", "prime salarié"], code: "BH", sens: "DEPENSE" },
  { keywords: ["urssaf salarié", "charge sociale salarié", "cotisation patronale"], code: "BI", sens: "DEPENSE" },
  { keywords: ["tva", "taxe valeur ajoutée"], code: "BJ", sens: "DEPENSE" },
  { keywords: ["cfe", "cvae", "contribution économique", "cotisation foncière"], code: "BK", sens: "DEPENSE" },
  { keywords: ["taxe foncière", "taxe", "impôt", "csg"], code: "BL", sens: "DEPENSE" },
  { keywords: ["loyer", "bail", "charge locative", "location bureau", "location cabinet"], code: "BM", sens: "DEPENSE" },
  { keywords: ["leasing", "crédit-bail", "location matériel", "location mobilier"], code: "BN", sens: "DEPENSE" },
  { keywords: ["entretien", "réparation", "maintenance", "nettoyage", "ménage"], code: "BO", sens: "DEPENSE" },
  { keywords: ["intérim", "intérimaire", "travail temporaire"], code: "BP", sens: "DEPENSE" },
  { keywords: ["outillage", "outil", "petit matériel", "petit équipement"], code: "BQ", sens: "DEPENSE" },
  { keywords: ["électricité", "edf", "engie", "gaz", "eau", "chauffage", "énergie"], code: "BR", sens: "DEPENSE" },
  { keywords: ["rétrocession", "rétrocédé", "honoraire rétrocédé"], code: "BS", sens: "DEPENSE" },
  { keywords: ["assurance", "mutuelle", "rcp", "responsabilité civile", "prévoyance"], code: "BT", sens: "DEPENSE" },
  { keywords: ["essence", "gasoil", "carburant", "péage", "parking", "véhicule", "voiture", "auto", "garage"], code: "BU", sens: "DEPENSE" },
  { keywords: ["train", "avion", "sncf", "hôtel", "hébergement", "déplacement", "taxi", "uber", "billet"], code: "BV", sens: "DEPENSE" },
  { keywords: ["urssaf", "carpimko", "cipav", "cnavpl", "carmf", "cnbf", "cotisation", "charge sociale", "retraite obligatoire"], code: "BW", sens: "DEPENSE" },
  { keywords: ["restaurant", "repas", "réception", "congrès", "séminaire", "publicité"], code: "BX", sens: "DEPENSE" },
  { keywords: ["téléphone", "internet", "abonnement", "courrier", "la poste", "timbre", "papeterie"], code: "BY", sens: "DEPENSE" },
  { keywords: ["acte notarié", "huissier", "contentieux", "greffe"], code: "BZ", sens: "DEPENSE" },
  { keywords: ["agios", "frais bancaire", "commission bancaire", "frais financier"], code: "CA", sens: "DEPENSE" },
  { keywords: ["logiciel", "documentation", "revue", "livre", "formation", "divers"], code: "CB", sens: "DEPENSE" },
  { keywords: ["perte", "créance irrécouvrable", "vol"], code: "CE", sens: "DEPENSE" },
];

export type Suggestion = {
  code: string;
  sens: "RECETTE" | "DEPENSE";
  score: number;
};

export function suggererRubrique(libelle: string): Suggestion | null {
  const normalized = libelle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let best: Suggestion | null = null;

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      const normalizedKeyword = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalized.includes(normalizedKeyword)) {
        const score = normalizedKeyword.length / normalized.length;
        if (!best || score > best.score) {
          best = { code: rule.code, sens: rule.sens, score };
        }
      }
    }
  }

  return best;
}
