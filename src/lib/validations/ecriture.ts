import { z } from "zod/v4";

export const ecritureSchema = z.object({
  date: z.iso.date({ message: "Date invalide" }),
  libelle: z.string().min(2, "Le libellé doit faire au moins 2 caractères"),
  montant: z.number().positive("Le montant doit être positif"),
  sens: z.enum(["RECETTE", "DEPENSE"]),
  rubrique2035Code: z.string().min(2, "Veuillez sélectionner une rubrique"),
  tvaCollectee: z.number().min(0).default(0),
  tvaDeductible: z.number().min(0).default(0),
  pieceRef: z.string().optional(),
});

export type EcritureFormData = z.infer<typeof ecritureSchema>;
