"use client";

import { useCallback, useEffect, useState } from "react";

type Ecriture = {
  id: string;
  date: string;
  libelle: string;
  montant: number;
  sens: "RECETTE" | "DEPENSE";
  rubrique2035Code: string;
  pieceRef: string | null;
  rubrique2035: { code: string; libelle: string };
};

type Props = {
  exerciceId: string;
  refreshKey: number;
};

export default function ListeEcritures({ exerciceId, refreshKey }: Props) {
  const [ecritures, setEcritures] = useState<Ecriture[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);

  const fetchEcritures = useCallback(async () => {
    try {
      const res = await fetch(`/api/ecritures?exerciceId=${exerciceId}`);
      if (res.ok) {
        const data = await res.json();
        setEcritures(data);
        // Détecter la nouvelle écriture pour l'animation
        if (data.length > 0 && data[0].id !== ecritures[0]?.id) {
          setNewId(data[0].id);
          setTimeout(() => setNewId(null), 1500);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [exerciceId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchEcritures();
  }, [fetchEcritures, refreshKey]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await fetch(`/api/ecritures/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEcritures((prev) => prev.filter((e) => e.id !== id));
    }
    setDeletingId(null);
  };

  const totalRecettes = ecritures
    .filter((e) => e.sens === "RECETTE")
    .reduce((sum, e) => sum + e.montant, 0);

  const totalDepenses = ecritures
    .filter((e) => e.sens === "DEPENSE")
    .reduce((sum, e) => sum + e.montant, 0);

  const solde = totalRecettes - totalDepenses;

  const formatMontant = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-border rounded w-1/3" />
          <div className="h-4 bg-border rounded w-full" />
          <div className="h-4 bg-border rounded w-full" />
          <div className="h-4 bg-border rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Dernières écritures</h2>
        <span className="text-sm text-muted">{ecritures.length} écriture{ecritures.length > 1 ? "s" : ""}</span>
      </div>

      {ecritures.length === 0 ? (
        <div className="px-6 py-12 text-center text-muted">
          <p>Aucune écriture saisie.</p>
          <p className="text-sm mt-1">Utilisez le formulaire pour ajouter votre première recette ou dépense.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="text-left px-4 py-2.5 font-medium text-muted">Date</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">Libellé</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">Rubrique</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted">Montant</th>
                  <th className="px-4 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody>
                {ecritures.slice(0, 20).map((e) => (
                  <tr
                    key={e.id}
                    className={`border-b border-border last:border-0 hover:bg-background/50 transition-all ${
                      newId === e.id ? "animate-fade-in bg-accent-light" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 text-muted whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="px-4 py-2.5 text-foreground">{e.libelle}</td>
                    <td className="px-4 py-2.5 text-muted text-xs">
                      <span className="bg-primary-lighter text-primary px-2 py-0.5 rounded">
                        {e.rubrique2035Code}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-medium whitespace-nowrap ${
                        e.sens === "RECETTE" ? "text-success" : "text-danger"
                      }`}
                    >
                      {e.sens === "RECETTE" ? "+" : "-"}{formatMontant(e.montant)}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => handleDelete(e.id)}
                        disabled={deletingId === e.id}
                        className="text-muted hover:text-danger transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="border-t border-border px-4 py-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted">Recettes</span>
              <p className="font-semibold text-success">{formatMontant(totalRecettes)}</p>
            </div>
            <div>
              <span className="text-muted">Dépenses</span>
              <p className="font-semibold text-danger">{formatMontant(totalDepenses)}</p>
            </div>
            <div>
              <span className="text-muted">Solde</span>
              <p className={`font-semibold ${solde >= 0 ? "text-success" : "text-danger"}`}>
                {formatMontant(solde)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
