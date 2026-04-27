"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROFESSIONS } from "@/lib/validations/inscription";

export default function InscriptionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
    profession: "",
    siret: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    setErrors({});

    // Validation côté client
    const newErrors: Record<string, string> = {};
    if (form.nom.length < 2) newErrors.nom = "Le nom doit faire au moins 2 caractères";
    if (!form.email.includes("@")) newErrors.email = "Adresse email invalide";
    if (form.password.length < 6) newErrors.password = "Au moins 6 caractères";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!form.profession) newErrors.profession = "Veuillez sélectionner une profession";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setGlobalError(data.error || "Une erreur est survenue");
        return;
      }

      // Rediriger vers la connexion avec un message de succès
      router.push("/connexion?inscrit=1");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent";

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">LC</span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold text-primary">Créer un compte</h1>
        <p className="text-muted mt-1">Commencez à gérer votre comptabilité BNC</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-foreground mb-1">
              Nom complet
            </label>
            <input
              id="nom"
              type="text"
              required
              value={form.nom}
              onChange={(e) => update("nom", e.target.value)}
              placeholder="Dr. Martin Dupont"
              className={inputClass}
            />
            {errors.nom && <p className="text-danger text-xs mt-1">{errors.nom}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="vous@exemple.fr"
              className={inputClass}
            />
            {errors.email && <p className="text-danger text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min. 6 caractères"
              className={inputClass}
            />
            {errors.password && <p className="text-danger text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirmation mot de passe */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Retapez votre mot de passe"
              className={inputClass}
            />
            {errors.confirmPassword && <p className="text-danger text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Profession */}
          <div>
            <label htmlFor="profession" className="block text-sm font-medium text-foreground mb-1">
              Profession
            </label>
            <select
              id="profession"
              required
              value={form.profession}
              onChange={(e) => update("profession", e.target.value)}
              className={inputClass}
            >
              <option value="">— Sélectionner votre profession —</option>
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.profession && <p className="text-danger text-xs mt-1">{errors.profession}</p>}
          </div>

          {/* SIRET */}
          <div>
            <label htmlFor="siret" className="block text-sm font-medium text-foreground mb-1">
              SIRET <span className="text-muted font-normal">(optionnel)</span>
            </label>
            <input
              id="siret"
              type="text"
              value={form.siret}
              onChange={(e) => update("siret", e.target.value)}
              placeholder="123 456 789 00012"
              className={inputClass}
            />
          </div>

          {/* Erreur globale */}
          {globalError && (
            <p className="text-danger text-sm bg-danger/10 px-3 py-2 rounded-lg">{globalError}</p>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {loading ? "Création en cours..." : "Créer mon compte"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-accent hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
