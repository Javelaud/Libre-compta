import { PrismaClient } from "../src/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const rubriques2035 = [
  // ─── RECETTES (BA → BF) — Formulaire 2035 B ─────────────
  { code: "BA", libelle: "Honoraires encaissés", type: "RECETTE" },
  { code: "BB", libelle: "Débours et rétrocessions", type: "RECETTE" },
  { code: "BC", libelle: "Revenus accessoires", type: "RECETTE" },
  { code: "BD", libelle: "Gains divers", type: "RECETTE" },
  { code: "BE", libelle: "Plus-values à court terme", type: "RECETTE" },
  { code: "BF", libelle: "Plus-values à long terme", type: "RECETTE" },

  // ─── DEPENSES (BG → CE) — Formulaire 2035 B ─────────────
  { code: "BG", libelle: "Achats", type: "DEPENSE" },
  { code: "BH", libelle: "Salaires nets versés", type: "DEPENSE" },
  { code: "BI", libelle: "Charges sociales sur salaires", type: "DEPENSE" },
  { code: "BJ", libelle: "Taxe sur la valeur ajoutée", type: "DEPENSE" },
  { code: "BK", libelle: "Contribution économique territoriale", type: "DEPENSE" },
  { code: "BL", libelle: "Autres impôts et taxes", type: "DEPENSE" },
  { code: "BM", libelle: "Loyers et charges locatives", type: "DEPENSE" },
  { code: "BN", libelle: "Location de matériel et mobilier", type: "DEPENSE" },
  { code: "BO", libelle: "Entretien et réparations", type: "DEPENSE" },
  { code: "BP", libelle: "Personnel intérimaire", type: "DEPENSE" },
  { code: "BQ", libelle: "Petit outillage", type: "DEPENSE" },
  { code: "BR", libelle: "Chauffage, eau, gaz, électricité", type: "DEPENSE" },
  { code: "BS", libelle: "Honoraires rétrocédés", type: "DEPENSE" },
  { code: "BT", libelle: "Primes d'assurances", type: "DEPENSE" },
  { code: "BU", libelle: "Frais de véhicules", type: "DEPENSE" },
  { code: "BV", libelle: "Autres frais de déplacement", type: "DEPENSE" },
  { code: "BW", libelle: "Charges sociales personnelles obligatoires", type: "DEPENSE" },
  { code: "BX", libelle: "Frais de réception, publicité", type: "DEPENSE" },
  { code: "BY", libelle: "Frais de correspondance et téléphone", type: "DEPENSE" },
  { code: "BZ", libelle: "Frais d'actes et de contentieux", type: "DEPENSE" },
  { code: "CA", libelle: "Frais bancaires", type: "DEPENSE" },
  { code: "CB", libelle: "Frais divers de gestion", type: "DEPENSE" },
  { code: "CC", libelle: "Dotations aux amortissements", type: "DEPENSE" },
  { code: "CD", libelle: "Divers à déduire", type: "DEPENSE" },
  { code: "CE", libelle: "Pertes diverses", type: "DEPENSE" },
];

const motsClesDefaut = [
  // Charges sociales — pas de TVA
  { motCle: "URSSAF", rubrique2035Code: "BW", sens: "DEPENSE", tauxTVA: 0 },
  { motCle: "CARPIMKO", rubrique2035Code: "BW", sens: "DEPENSE", tauxTVA: 0 },
  { motCle: "CARMF", rubrique2035Code: "BW", sens: "DEPENSE", tauxTVA: 0 },
  { motCle: "CAVEC", rubrique2035Code: "BW", sens: "DEPENSE", tauxTVA: 0 },
  { motCle: "CIPAV", rubrique2035Code: "BW", sens: "DEPENSE", tauxTVA: 0 },
  { motCle: "CNAVPL", rubrique2035Code: "BW", sens: "DEPENSE", tauxTVA: 0 },
  { motCle: "CNBF", rubrique2035Code: "BW", sens: "DEPENSE", tauxTVA: 0 },
  // Loyer — TVA 20%
  { motCle: "LOYER", rubrique2035Code: "BM", sens: "DEPENSE", tauxTVA: 20 },
  // Énergie — TVA 20%
  { motCle: "EDF", rubrique2035Code: "BR", sens: "DEPENSE", tauxTVA: 20 },
  { motCle: "ENGIE", rubrique2035Code: "BR", sens: "DEPENSE", tauxTVA: 20 },
  // Télécom — TVA 20%
  { motCle: "ORANGE", rubrique2035Code: "BY", sens: "DEPENSE", tauxTVA: 20 },
  { motCle: "SFR", rubrique2035Code: "BY", sens: "DEPENSE", tauxTVA: 20 },
  { motCle: "FREE", rubrique2035Code: "BY", sens: "DEPENSE", tauxTVA: 20 },
  { motCle: "BOUYGUES", rubrique2035Code: "BY", sens: "DEPENSE", tauxTVA: 20 },
  // Assurance — pas de TVA
  { motCle: "MACSF", rubrique2035Code: "BT", sens: "DEPENSE", tauxTVA: 0 },
  { motCle: "AXA", rubrique2035Code: "BT", sens: "DEPENSE", tauxTVA: 0 },
  { motCle: "ALLIANZ", rubrique2035Code: "BT", sens: "DEPENSE", tauxTVA: 0 },
  // Carburant — TVA 20%
  { motCle: "TOTAL", rubrique2035Code: "BU", sens: "DEPENSE", tauxTVA: 20 },
  { motCle: "CARBURANT", rubrique2035Code: "BU", sens: "DEPENSE", tauxTVA: 20 },
  { motCle: "ESSENCE", rubrique2035Code: "BU", sens: "DEPENSE", tauxTVA: 20 },
  { motCle: "SHELL", rubrique2035Code: "BU", sens: "DEPENSE", tauxTVA: 20 },
  // Transport — TVA 10%
  { motCle: "SNCF", rubrique2035Code: "BV", sens: "DEPENSE", tauxTVA: 10 },
  // Véhicule — TVA 20%
  { motCle: "PEAGE", rubrique2035Code: "BU", sens: "DEPENSE", tauxTVA: 20 },
  { motCle: "PARKING", rubrique2035Code: "BU", sens: "DEPENSE", tauxTVA: 20 },
  // Courrier — TVA 20%
  { motCle: "LA POSTE", rubrique2035Code: "BY", sens: "DEPENSE", tauxTVA: 20 },
];

async function main() {
  console.log("Seeding rubriques 2035...");

  // Upsert rubriques (safe pour re-run)
  for (const rubrique of rubriques2035) {
    await prisma.rubrique2035.upsert({
      where: { code: rubrique.code },
      update: { libelle: rubrique.libelle, type: rubrique.type },
      create: rubrique,
    });
  }
  console.log(`${rubriques2035.length} rubriques 2035 OK.`);

  // Mots-clés par défaut (liés au premier utilisateur)
  const user = await prisma.user.findFirst();
  if (user) {
    for (const mc of motsClesDefaut) {
      await prisma.motCle.upsert({
        where: { userId_motCle: { userId: user.id, motCle: mc.motCle } },
        update: { rubrique2035Code: mc.rubrique2035Code, sens: mc.sens, tauxTVA: mc.tauxTVA },
        create: { ...mc, userId: user.id },
      });
    }
    console.log(`${motsClesDefaut.length} mots-clés par défaut OK.`);

    // Créer un compte bancaire par défaut s'il n'existe pas
    const compte = await prisma.compteBancaire.findFirst({ where: { userId: user.id } });
    if (!compte) {
      await prisma.compteBancaire.create({
        data: { userId: user.id, nom: "Compte professionnel" },
      });
      console.log("Compte bancaire par défaut créé.");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
