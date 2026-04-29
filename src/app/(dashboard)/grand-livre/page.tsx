"use client";

import { useCallback, useEffect, useState } from "react";
import ExportCSV from "@/components/ExportCSV";
import RubriqueCombobox from "@/components/ui/RubriqueCombobox";
import { useYear } from "@/contexts/YearContext";

type EcritureLigne = {
  id: string;
  date: string;
  libelle: string;
  montant: number;
  sens: string;
  pieceRef: string | null;
  debit: number;
  credit: number;
  soldeCumule: number;
};

type Groupe = {
  code: string;
  libelle: string;
  type: string;
  ecritures: EcritureLigne[];
  totalDebit: number;
  totalCredit: number;
};

type RubriqueOption = { code: string; libelle: string; type: string };

const fmt = (n: number) =>
  n === 0
    ? "—"
    : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

const fmtFull = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function GrandLivrePage() {
  const { year } = useYear();
  const [exerciceId, setExerciceId] = useState<string | null>(null);
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [rubriques, setRubriques] = useState<RubriqueOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtreSens, setFiltreSens] = useState("");
  const [filtreMois, setFiltreMois] = useState("");
  const [filtreRubrique, setFiltreRubrique] = useState("");

  const annee = year;
  const [moisOptions, setMoisOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    setMoisOptions(
      Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, "0");
        const label = new Date(year, i).toLocaleDateString("fr-FR", { month: "long" });
        return { value: `${year}-${m}`, label: `${label} ${year}` };
      })
    );
  }, [year]);

  useEffect(() => {
    setExerciceId(null);
    Promise.all([
      fetch(`/api/exercice/courant?annee=${year}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/rubriques").then((r) => r.json()),
    ]).then(([ex, rub]) => {
      if (ex?.id) setExerciceId(ex.id);
      setRubriques(rub);
    });
  }, [year]);

  const fetchData = useCallback(async () => {
    if (!exerciceId) return;
    setLoading(true);
    const params = new URLSearchParams({ exerciceId });
    if (filtreSens) params.set("sens", filtreSens);
    if (filtreMois) params.set("mois", filtreMois);
    if (filtreRubrique) params.set("rubrique", filtreRubrique);

    const res = await fetch(`/api/grand-livre?${params}`);
    if (res.ok) setGroupes(await res.json());
    setLoading(false);
  }, [exerciceId, filtreSens, filtreMois, filtreRubrique]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalDebit = groupes.reduce((s, g) => s + g.totalDebit, 0);
  const totalCredit = groupes.reduce((s, g) => s + g.totalCredit, 0);
  const resultat = totalCredit - totalDebit;

  // Données CSV
  const csvData = groupes.flatMap((g) =>
    g.ecritures.map((e) => ({
      Rubrique: g.code,
      "Libellé rubrique": g.libelle,
      Date: formatDate(e.date),
      Pièce: e.pieceRef ?? "",
      Libellé: e.libelle,
      Dépense: e.debit,
      Recette: e.credit,
      "Solde cumulé": e.soldeCumule,
    }))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1">Grand livre</h1>
          <p className="text-muted">Détail des écritures par rubrique 2035</p>
        </div>
        <ExportCSV data={csvData} filename={`grand-livre-${annee}`} />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filtreSens}
          onChange={(e) => setFiltreSens(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Tout</option>
          <option value="RECETTE">Recettes</option>
          <option value="DEPENSE">Dépenses</option>
        </select>
        <select
          value={filtreMois}
          onChange={(e) => setFiltreMois(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Tous les mois</option>
          {moisOptions.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <div className="w-64">
          <RubriqueCombobox
            rubriques={rubriques}
            value={filtreRubrique}
            onChange={(code) => setFiltreRubrique(code)}
            placeholder="Toutes les rubriques"
            emptyLabel="Toutes les rubriques"
            allowEmpty
          />
        </div>
      </div>

      {/* Résumé */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted">Total recettes</p>
          <p className="text-2xl font-bold text-success">{fmtFull(totalCredit)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted">Total dépenses</p>
          <p className="text-2xl font-bold text-danger">{fmtFull(totalDebit)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted">Résultat</p>
          <p className={`text-2xl font-bold ${resultat >= 0 ? "text-success" : "text-danger"}`}>
            {fmtFull(resultat)}
          </p>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-border rounded w-1/4" />
            <div className="h-4 bg-border rounded w-full" />
            <div className="h-4 bg-border rounded w-full" />
          </div>
        </div>
      ) : groupes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border px-6 py-12 text-center text-muted">
          <p>Aucune écriture trouvée pour ces critères.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupes.map((g) => (
            <div key={g.code} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* En-tête rubrique */}
              <div className="px-5 py-3 border-b border-border bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    g.type === "RECETTE" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                  }`}>
                    {g.code}
                  </span>
                  <span className="font-semibold text-primary text-sm">{g.libelle}</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <span className="text-success font-medium">{fmtFull(g.totalCredit)}</span>
                  <span className="text-danger font-medium">{fmtFull(g.totalDebit)}</span>
                </div>
              </div>

              {/* Tableau */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/30">
                      <th className="text-left px-5 py-2 font-medium text-muted w-24">Date</th>
                      <th className="text-left px-5 py-2 font-medium text-muted w-24">Pièce</th>
                      <th className="text-left px-5 py-2 font-medium text-muted">Libellé</th>
                      <th className="text-right px-5 py-2 font-medium text-muted w-28">Dépense</th>
                      <th className="text-right px-5 py-2 font-medium text-muted w-28">Recette</th>
                      <th className="text-right px-5 py-2 font-medium text-muted w-28">Solde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.ecritures.map((e) => (
                      <tr key={e.id} className="border-b border-border last:border-0 hover:bg-background/50">
                        <td className="px-5 py-2 text-muted">{formatDate(e.date)}</td>
                        <td className="px-5 py-2 text-muted text-xs">{e.pieceRef || "—"}</td>
                        <td className="px-5 py-2 text-foreground">{e.libelle}</td>
                        <td className="px-5 py-2 text-right text-danger font-medium">{fmt(e.debit)}</td>
                        <td className="px-5 py-2 text-right text-success font-medium">{fmt(e.credit)}</td>
                        <td className={`px-5 py-2 text-right font-medium ${e.soldeCumule >= 0 ? "text-primary" : "text-danger"}`}>
                          {fmtFull(e.soldeCumule)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Total général */}
          <div className="bg-primary rounded-xl p-5 text-white">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-white/60 text-sm">Total recettes</p>
                <p className="text-xl font-bold">{fmtFull(totalCredit)}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Total dépenses</p>
                <p className="text-xl font-bold">{fmtFull(totalDebit)}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Résultat net</p>
                <p className="text-xl font-bold">{fmtFull(resultat)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
