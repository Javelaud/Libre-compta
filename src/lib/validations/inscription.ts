import { z } from "zod/v4";

export const inscriptionSchema = z
  .object({
    nom: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
    email: z.email("Adresse email invalide"),
    password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
    confirmPassword: z.string(),
    profession: z.string().min(1, "Veuillez sélectionner une profession"),
    siret: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type InscriptionFormData = z.infer<typeof inscriptionSchema>;

export const PROFESSIONS = [
  "Médecin",
  "Avocat",
  "Architecte",
  "Consultant",
  "Kinésithérapeute",
  "Infirmier",
  "Expert-comptable",
  "Dentiste",
  "Vétérinaire",
  "Ostéopathe",
  "Psychologue",
  "Autre",
] as const;
