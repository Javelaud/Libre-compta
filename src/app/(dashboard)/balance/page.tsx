"use client";

import { useCallback, useEffect, useState } from "react";
import ExportCSV from "@/components/ExportCSV";

type LigneBalance = {
  code: string;
  libelle: string;
  type: string;
  totalRecettes: number;
  totalDepenses: number;
  nbEcritures: number;
};

type BalanceData = {
  lignes: LigneBalance[];
  totalRecettes: number;
  totalDepenses: number;
  solde: number;
};

const formatMontant = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export default function BalancePage() {
  const [exerciceId, setExerciceId] = useState<string | null>(null);
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<"" | "RECETTE" | "DEPENSE">("");

  useEffect(() => {
    fetch("/api/exercice/courant")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.id) setExerciceId(d.id);
      });
  }, []);

  const fetchData = useCallback(async () => {
    if (!exerciceId) return;
    setLoading(true);
    const res = await fetch(`/api/balance?exerciceId=${exerciceId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [exerciceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const lignesFiltrees = data?.lignes.filter((l) => {
    if (!filtre) return true;
    return l.type === filtre;
  }) ?? [];

  const recettesFiltre = lignesFiltrees.filter((l) => l.type === "RECETTE");
  const depensesFiltre = lignesFiltrees.filter((l) => l.type === "DEPENSE");

  const csvData = lignesFiltrees.map((l) => ({
    Code: l.code,
    Rubrique: l.libelle,
    Type: l.type === "RECETTE" ? "Recette" : "Dépense",
    Recettes: l.totalRecettes,
    Dépenses: l.totalDepenses,
    Solde: l.totalRecettes - l.totalDepenses,
    "Nb écritures": l.nbEcritures,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1">Balance</h1>
          <p className="text-muted">Synthèse des totaux par rubrique 2035</p>
        </div>
        <ExportCSV data={csvData} filename="balance-2035" />
      </div>

      {/* Résumé en cartes */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted">Total recettes</p>
          <p className="text-2xl font-bold text-success">
            {formatMontant(data?.totalRecettes ?? 0)}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted">Total dépenses</p>
          <p className="text-2xl font-bold text-danger">
            {formatMontant(data?.totalDepenses ?? 0)}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted">Résultat net</p>
          <p
            className={`text-2xl font-bold ${
              (data?.solde ?? 0) >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatMontant(data?.solde ?? 0)}
          </p>
        </div>
      </div>

      {/* Filtre */}
      <div className="mb-4">
        <select
          value={filtre}
          onChange={(e) => setFiltre(e.target.value as "" | "RECETTE" | "DEPENSE")}
          className="px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Toutes les rubriques</option>
          <option value="RECETTE">Recettes uniquement</option>
          <option value="DEPENSE">Dépenses uniquement</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-border rounded w-1/3" />
            <div className="h-4 bg-border rounded w-full" />
            <div className="h-4 bg-border rounded w-full" />
          </div>
        </div>
      ) : !data || data.lignes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border px-6 py-12 text-center text-muted">
          <p>Aucune écriture saisie sur cet exercice.</p>
          <p className="text-sm mt-1">La balance se remplira automatiquement avec vos saisies.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tableau Recettes */}
          {(!filtre || filtre === "RECETTE") && recettesFiltre.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-success/5">
                <h2 className="font-semibold text-primary">Recettes</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/30">
                    <th className="text-left px-5 py-2.5 font-medium text-muted w-20">Code</th>
                    <th className="text-left px-5 py-2.5 font-medium text-muted">Rubrique</th>
                    <th className="text-center px-5 py-2.5 font-medium text-muted w-20">Nb</th>
                    <th className="text-right px-5 py-2.5 font-medium text-muted w-36">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {recettesFiltre.map((l) => (
                    <tr key={l.code} className="border-b border-border last:border-0 hover:bg-background/50">
                      <td className="px-5 py-2.5">
                        <span className="bg-success/10 text-success text-xs font-bold px-2 py-0.5 rounded">
                          {l.code}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-foreground">{l.libelle}</td>
                      <td className="px-5 py-2.5 text-center text-muted">{l.nbEcritures}</td>
                      <td className="px-5 py-2.5 text-right font-medium text-success">
                        {formatMontant(l.totalRecettes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-success/5">
                    <td colSpan={3} className="px-5 py-2.5 font-semibold text-primary">
                      Total recettes
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold text-success">
                      {formatMontant(recettesFiltre.reduce((s, l) => s + l.totalRecettes, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Tableau Dépenses */}
          {(!filtre || filtre === "DEPENSE") && depensesFiltre.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-danger/5">
                <h2 className="font-semibold text-primary">Dépenses</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/30">
                    <th className="text-left px-5 py-2.5 font-medium text-muted w-20">Code</th>
                    <th className="text-left px-5 py-2.5 font-medium text-muted">Rubrique</th>
                    <th className="text-center px-5 py-2.5 font-medium text-muted w-20">Nb</th>
                    <th className="text-right px-5 py-2.5 font-medium text-muted w-36">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {depensesFiltre.map((l) => (
                    <tr key={l.code} className="border-b border-border last:border-0 hover:bg-background/50">
                      <td className="px-5 py-2.5">
                        <span className="bg-danger/10 text-danger text-xs font-bold px-2 py-0.5 rounded">
                          {l.code}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-foreground">{l.libelle}</td>
                      <td className="px-5 py-2.5 text-center text-muted">{l.nbEcritures}</td>
                      <td className="px-5 py-2.5 text-right font-medium text-danger">
                        {formatMontant(l.totalDepenses)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-danger/5">
                    <td colSpan={3} className="px-5 py-2.5 font-semibold text-primary">
                      Total dépenses
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold text-danger">
                      {formatMontant(depensesFiltre.reduce((s, l) => s + l.totalDepenses, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Résultat final */}
          {!filtre && (
            <div className="bg-primary rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Résultat net de l&apos;exercice</p>
                  <p className="text-sm text-white/50 mt-0.5">Recettes - Dépenses</p>
                </div>
                <p className="text-3xl font-bold">
                  {formatMontant(data.solde)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
