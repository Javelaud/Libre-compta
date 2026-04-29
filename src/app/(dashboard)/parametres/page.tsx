"use client";

import { useEffect, useState } from "react";
import SoldesInitiauxSection from "@/components/parametres/SoldesInitiauxSection";

const PROFESSIONS = [
  "Médecin", "Avocat", "Architecte", "Consultant", "Kinésithérapeute",
  "Infirmier", "Expert-comptable", "Dentiste", "Vétérinaire",
  "Ostéopathe", "Psychologue", "Autre",
];

const REGIMES_TVA = [
  { value: "EXONERE", label: "Exonéré de TVA" },
  { value: "FRANCHISE", label: "Franchise en base (art. 293 B)" },
  { value: "REEL_MENSUEL", label: "Réel normal mensuel" },
  { value: "REEL_TRIMESTRIEL", label: "Réel normal trimestriel" },
  { value: "REEL_ANNUEL", label: "Réel simplifié annuel" },
];

const TAUX_TVA = [
  { value: 20, label: "20 %" },
  { value: 10, label: "10 %" },
  { value: 5.5, label: "5,5 %" },
  { value: 2.1, label: "2,1 %" },
];

type UserProfile = {
  nom: string;
  email: string;
  siret: string;
  profession: string;
  regimeTVA: string;
  tauxTVA: number;
};

export default function ParametresPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    nom: "", siret: "", profession: "", regimeTVA: "FRANCHISE", tauxTVA: 20,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/profil")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setProfile(data);
          setForm({
            nom: data.nom || "",
            siret: data.siret || "",
            profession: data.profession || "",
            regimeTVA: data.regimeTVA || "FRANCHISE",
            tauxTVA: data.tauxTVA ?? 20,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const update = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    const res = await fetch("/api/user/profil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSuccess(true);
      const updated = await res.json();
      setProfile(updated);
    }
    setSaving(false);
  };

  const isAssujetti = ["REEL_MENSUEL", "REEL_TRIMESTRIEL", "REEL_ANNUEL"].includes(form.regimeTVA);

  const inputClass =
    "w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent";

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-primary mb-1">Paramètres</h1>
        <p className="text-muted mb-8">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-1">Paramètres</h1>
      <p className="text-muted mb-8">Configuration de votre compte et préférences fiscales</p>

      <div className="max-w-2xl space-y-6">
        {/* Informations professionnelles */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-primary mb-4">Informations professionnelles</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nom complet</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => update("nom", e.target.value)}
                placeholder="Dr. Martin Dupont"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email <span className="text-muted font-normal">(non modifiable)</span>
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className={`${inputClass} opacity-60`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Profession</label>
              <select
                value={form.profession}
                onChange={(e) => update("profession", e.target.value)}
                className={inputClass}
              >
                <option value="">— Sélectionner —</option>
                {PROFESSIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">SIRET</label>
              <input
                type="text"
                value={form.siret}
                onChange={(e) => update("siret", e.target.value)}
                placeholder="123 456 789 00012"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Régime fiscal */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-primary mb-4">Régime fiscal</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Régime d&apos;imposition</label>
              <input
                type="text"
                value="Déclaration contrôlée (BNC)"
                disabled
                className={`${inputClass} opacity-60`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Régime de TVA</label>
              <select
                value={form.regimeTVA}
                onChange={(e) => update("regimeTVA", e.target.value)}
                className={inputClass}
              >
                {REGIMES_TVA.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1">
                {isAssujetti
                  ? "Les champs TVA seront affichés dans la saisie."
                  : "Les champs TVA seront masqués dans la saisie."}
              </p>
            </div>

            {isAssujetti && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Taux de TVA par défaut</label>
                <select
                  value={form.tauxTVA}
                  onChange={(e) => update("tauxTVA", Number(e.target.value))}
                  className={inputClass}
                >
                  {TAUX_TVA.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Actions profil + régime */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
          {success && (
            <span className="text-success text-sm font-medium">Modifications enregistrées</span>
          )}
        </div>

        {/* Compte professionnel — soldes initiaux */}
        <SoldesInitiauxSection />
      </div>
    </div>
  );
}
