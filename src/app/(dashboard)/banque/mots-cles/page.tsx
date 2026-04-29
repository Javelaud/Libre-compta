"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RubriqueCombobox from "@/components/ui/RubriqueCombobox";

type Rubrique = { code: string; libelle: string; type: string };
type MotCle = {
  id: string;
  motCle: string;
  rubrique2035Code: string;
  sens: string;
  tauxTVA: number;
  rubrique2035: Rubrique;
};

const TAUX_OPTIONS = [
  { value: 0, label: "Pas de TVA" },
  { value: 20, label: "20 %" },
  { value: 10, label: "10 %" },
  { value: 5.5, label: "5,5 %" },
  { value: 2.1, label: "2,1 %" },
];

export default function MotsClesPage() {
  const [motsCles, setMotsCles] = useState<MotCle[]>([]);
  const [rubriques, setRubriques] = useState<Rubrique[]>([]);
  const [newMotCle, setNewMotCle] = useState("");
  const [newRubrique, setNewRubrique] = useState("");
  const [newSens, setNewSens] = useState("DEPENSE");
  const [newTauxTVA, setNewTauxTVA] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/banque/mots-cles").then((r) => r.json()),
      fetch("/api/rubriques").then((r) => r.json()),
    ])
      .then(([mc, rub]) => {
        setMotsCles(mc);
        setRubriques(rub);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchMotsCles = () => {
    fetch("/api/banque/mots-cles")
      .then((r) => r.json())
      .then(setMotsCles)
      .catch(() => {});
  };

  const handleAdd = async () => {
    if (!newMotCle || !newRubrique) return;
    await fetch("/api/banque/mots-cles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        motCle: newMotCle,
        rubrique2035Code: newRubrique,
        sens: newSens,
        tauxTVA: newTauxTVA,
      }),
    });
    setNewMotCle("");
    setNewRubrique("");
    setNewTauxTVA(0);
    fetchMotsCles();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/banque/mots-cles/${id}`, { method: "DELETE" });
    setMotsCles((prev) => prev.filter((m) => m.id !== id));
  };

  const inputClass =
    "px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/banque" className="text-muted hover:text-primary transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary">Mots-clés de catégorisation</h1>
          <p className="text-muted">Associez des mots-clés bancaires à des rubriques 2035</p>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-muted mb-1">Mot-clé</label>
            <input type="text" value={newMotCle} onChange={(e) => setNewMotCle(e.target.value.toUpperCase())}
              placeholder="Ex: URSSAF" className={inputClass + " w-full"} />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-muted mb-1">Rubrique 2035</label>
            <RubriqueCombobox
              rubriques={rubriques}
              value={newRubrique}
              onChange={(code, rub) => {
                setNewRubrique(code);
                if (rub?.type) setNewSens(rub.type);
              }}
              placeholder="— Sélectionner —"
              allowEmpty={false}
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-muted mb-1">Sens</label>
            <select value={newSens} onChange={(e) => setNewSens(e.target.value)} className={inputClass + " w-full"}>
              <option value="DEPENSE">Dépense</option>
              <option value="RECETTE">Recette</option>
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-muted mb-1">Taux TVA</label>
            <select value={newTauxTVA} onChange={(e) => setNewTauxTVA(Number(e.target.value))} className={inputClass + " w-full"}>
              {TAUX_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <button onClick={handleAdd} disabled={!newMotCle || !newRubrique}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50">
            Ajouter
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-6 animate-pulse space-y-3">
            <div className="h-4 bg-border rounded w-full" />
            <div className="h-4 bg-border rounded w-full" />
          </div>
        ) : motsCles.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted">
            <p>Aucun mot-clé défini.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/30">
                <th className="text-left px-5 py-2.5 font-medium text-muted">Mot-clé</th>
                <th className="text-left px-5 py-2.5 font-medium text-muted">Rubrique 2035</th>
                <th className="text-left px-5 py-2.5 font-medium text-muted w-28">Sens</th>
                <th className="text-right px-5 py-2.5 font-medium text-muted w-24">Taux TVA</th>
                <th className="text-center px-5 py-2.5 font-medium text-muted w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {motsCles.map((mc) => (
                <tr key={mc.id} className="border-b border-border last:border-0 hover:bg-background/50">
                  <td className="px-5 py-2.5 font-medium text-foreground">{mc.motCle}</td>
                  <td className="px-5 py-2.5">
                    <span className="bg-primary-lighter text-primary text-xs px-2 py-0.5 rounded mr-2">
                      {mc.rubrique2035Code}
                    </span>
                    <span className="text-muted">{mc.rubrique2035.libelle}</span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      mc.sens === "RECETTE" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    }`}>
                      {mc.sens === "RECETTE" ? "Recette" : "Dépense"}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right text-muted">
                    {mc.tauxTVA > 0 ? `${mc.tauxTVA} %` : "—"}
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <button onClick={() => handleDelete(mc.id)}
                      className="text-muted hover:text-danger transition-colors" title="Supprimer">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
