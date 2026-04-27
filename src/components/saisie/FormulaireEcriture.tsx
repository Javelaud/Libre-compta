"use client";

import { useForm } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";
import { suggererRubrique } from "@/lib/categorisation";
import type { EcritureFormData } from "@/lib/validations/ecriture";

type Rubrique = { code: string; libelle: string; type: "RECETTE" | "DEPENSE" };

type Props = {
  exerciceId: string;
  showTVA: boolean;
  tauxTVA: number;
  onCreated: () => void;
};

export default function FormulaireEcriture({ exerciceId, showTVA, tauxTVA, onCreated }: Props) {
  const [rubriques, setRubriques] = useState<Rubrique[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EcritureFormData>({
    defaultValues: {
      date: "",
      sens: "RECETTE",
      montant: undefined,
      tvaCollectee: 0,
      tvaDeductible: 0,
      libelle: "",
      rubrique2035Code: "",
      pieceRef: "",
    },
  });

  const sens = watch("sens");
  const libelle = watch("libelle");

  useEffect(() => {
    setValue("date", new Date().toISOString().slice(0, 10));
  }, [setValue]);

  useEffect(() => {
    fetch("/api/rubriques")
      .then((r) => r.json())
      .then(setRubriques)
      .catch(() => {});
  }, []);

  const handleCategorisation = useCallback(
    (text: string) => {
      if (text.length < 3) {
        setSuggestion(null);
        return;
      }
      const result = suggererRubrique(text);
      if (result) {
        setValue("rubrique2035Code", result.code);
        setValue("sens", result.sens);
        const rub = rubriques.find((r) => r.code === result.code);
        setSuggestion(rub ? `${rub.code} — ${rub.libelle}` : result.code);
      } else {
        setSuggestion(null);
      }
    },
    [rubriques, setValue]
  );

  useEffect(() => {
    const timeout = setTimeout(() => handleCategorisation(libelle), 300);
    return () => clearTimeout(timeout);
  }, [libelle, handleCategorisation]);

  const rubriquesFiltered = rubriques.filter((r) => r.type === sens);

  const onSubmit = async (data: EcritureFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ecritures?exerciceId=${exerciceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          montant: Number(data.montant),
          tvaCollectee: showTVA ? Number(data.tvaCollectee) : 0,
          tvaDeductible: showTVA ? Number(data.tvaDeductible) : 0,
        }),
      });
      if (res.ok) {
        reset();
        setValue("date", new Date().toISOString().slice(0, 10));
        setSuggestion(null);
        onCreated();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-lg font-semibold text-primary mb-4">Nouvelle écriture</h2>

      {/* Sens (toggle) */}
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setValue("sens", "RECETTE")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            sens === "RECETTE"
              ? "bg-success text-white"
              : "bg-background border border-border text-muted hover:text-foreground"
          }`}
        >
          Recette
        </button>
        <button
          type="button"
          onClick={() => setValue("sens", "DEPENSE")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            sens === "DEPENSE"
              ? "bg-danger text-white"
              : "bg-background border border-border text-muted hover:text-foreground"
          }`}
        >
          Dépense
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Date</label>
          <input
            type="date"
            {...register("date", { required: "Date requise" })}
            className={inputClass}
          />
          {errors.date && <p className="text-danger text-xs mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Montant {showTVA ? "HT" : ""} (€)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0,00"
            {...register("montant", {
              required: "Montant requis",
              valueAsNumber: true,
              min: { value: 0.01, message: "Le montant doit être positif" },
            })}
            className={inputClass}
          />
          {errors.montant && <p className="text-danger text-xs mt-1">{errors.montant.message}</p>}
        </div>
      </div>

      {/* Libellé */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-foreground mb-1">Libellé</label>
        <input
          type="text"
          placeholder="Ex: Consultation patient, Loyer cabinet, Essence..."
          {...register("libelle", { required: "Libellé requis", minLength: { value: 2, message: "Min. 2 caractères" } })}
          className={inputClass}
        />
        {errors.libelle && <p className="text-danger text-xs mt-1">{errors.libelle.message}</p>}
        {suggestion && (
          <p className="text-xs text-accent mt-1">
            Catégorie suggérée : <span className="font-medium">{suggestion}</span>
          </p>
        )}
      </div>

      {/* Rubrique 2035 */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-foreground mb-1">Rubrique 2035</label>
        <select
          {...register("rubrique2035Code", { required: "Rubrique requise" })}
          className={inputClass}
        >
          <option value="">— Sélectionner une rubrique —</option>
          {rubriquesFiltered.map((r) => (
            <option key={r.code} value={r.code}>
              {r.code} — {r.libelle}
            </option>
          ))}
        </select>
        {errors.rubrique2035Code && (
          <p className="text-danger text-xs mt-1">{errors.rubrique2035Code.message}</p>
        )}
      </div>

      {/* TVA — conditionnel selon le régime */}
      {showTVA && (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              TVA collectée (€)
            </label>
            <input type="number" step="0.01" {...register("tvaCollectee", { valueAsNumber: true })} className={inputClass} />
            <p className="text-xs text-muted mt-1">Taux : {tauxTVA} %</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              TVA déductible (€)
            </label>
            <input type="number" step="0.01" {...register("tvaDeductible", { valueAsNumber: true })} className={inputClass} />
            <p className="text-xs text-muted mt-1">Taux : {tauxTVA} %</p>
          </div>
        </div>
      )}

      {/* Référence pièce */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-foreground mb-1">
          N° de pièce <span className="text-muted font-normal">(optionnel)</span>
        </label>
        <input type="text" placeholder="Ex: FACT-2026-001" {...register("pieceRef")} className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-6 bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
      >
        {submitting ? "Enregistrement..." : "Enregistrer l'écriture"}
      </button>
    </form>
  );
}
