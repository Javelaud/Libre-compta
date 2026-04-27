"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Rubrique = { code: string; libelle: string; type: string };
type Transaction = {
  id: string;
  date: string;
  libelleBancaire: string;
  montant: number;
  tva: number;
  statut: string;
  rubrique2035Code: string | null;
  libelleComptable: string | null;
  sens: string | null;
  rubrique2035: Rubrique | null;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function BanquePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rubriques, setRubriques] = useState<Rubrique[]>([]);
  const [solde, setSolde] = useState(0);
  const [compteNom, setCompteNom] = useState("");
  const [tab, setTab] = useState("A_CATEGORISER");
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [editSolde, setEditSolde] = useState(false);
  const [newSolde, setNewSolde] = useState("");
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState({ aCat: 0, val: 0, ign: 0 });
  const [showTVA, setShowTVA] = useState(false);
  const [tauxTVA, setTauxTVA] = useState(20);

  useEffect(() => {
    Promise.all([
      fetch("/api/rubriques").then((r) => r.json()),
      fetch("/api/banque/solde").then((r) => r.json()),
      fetch("/api/user/profil").then((r) => r.json()),
    ]).then(([rub, compte, profil]) => {
      setRubriques(rub);
      setSolde(compte.solde ?? 0);
      setCompteNom(compte.nom ?? "Compte");
      if (profil?.regimeTVA) {
        setShowTVA(["REEL_MENSUEL", "REEL_TRIMESTRIEL", "REEL_ANNUEL"].includes(profil.regimeTVA));
        setTauxTVA(profil.tauxTVA ?? 20);
      }
    });
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ statut: tab });
    if (search) params.set("q", search);
    const res = await fetch(`/api/banque/transactions?${params}`);
    if (res.ok) setTransactions(await res.json());
    setLoading(false);
  }, [tab, search]);

  const fetchCounts = useCallback(async () => {
    const [a, v, i] = await Promise.all([
      fetch("/api/banque/transactions?statut=A_CATEGORISER").then((r) => r.json()),
      fetch("/api/banque/transactions?statut=VALIDEE").then((r) => r.json()),
      fetch("/api/banque/transactions?statut=IGNOREE").then((r) => r.json()),
    ]);
    setCounts({ aCat: a.length, val: v.length, ign: i.length });
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Import CSV
  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/banque/import", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok) {
      setImportResult(`${data.importees} importées, ${data.matchees} catégorisées auto, ${data.doublons} doublons ignorés`);
      fetchTransactions();
      fetchCounts();
    } else {
      setImportResult(data.error || "Erreur d'import");
    }
    setShowImport(false);
  };

  // Mise à jour inline
  const updateTransaction = async (id: string, field: string, value: string) => {
    await fetch(`/api/banque/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    fetchTransactions();
  };

  // Valider
  const validerTransaction = async (id: string) => {
    const res = await fetch(`/api/banque/transactions/${id}`, { method: "POST" });
    if (res.ok) {
      fetchTransactions();
      fetchCounts();
    }
  };

  // Ignorer
  const ignorerTransaction = async (id: string) => {
    await fetch(`/api/banque/transactions/${id}`, { method: "DELETE" });
    fetchTransactions();
    fetchCounts();
  };

  // Solde
  const saveSolde = async () => {
    await fetch("/api/banque/solde", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ solde: parseFloat(newSolde) }),
    });
    setSolde(parseFloat(newSolde));
    setEditSolde(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-1">Banque</h1>
      <p className="text-muted mb-6">Importez et catégorisez vos relevés bancaires</p>

      {/* Zone haute — Solde + Import */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-muted">{compteNom}</p>
            <button onClick={() => { setEditSolde(!editSolde); setNewSolde(String(solde)); }} className="text-muted hover:text-accent text-xs">
              Modifier
            </button>
          </div>
          {editSolde ? (
            <div className="flex gap-2 items-center">
              <input type="number" step="0.01" value={newSolde} onChange={(e) => setNewSolde(e.target.value)}
                className="px-2 py-1 border border-border rounded text-lg font-bold w-40" autoFocus />
              <button onClick={saveSolde} className="text-success text-sm font-medium">OK</button>
            </div>
          ) : (
            <p className={`text-3xl font-bold ${solde >= 0 ? "text-success" : "text-danger"}`}>{fmt(solde)}</p>
          )}
        </div>
        <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-center">
          <button onClick={() => setShowImport(true)}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-light transition-colors">
            Importer un relevé
          </button>
        </div>
      </div>

      {/* Résultat import */}
      {importResult && (
        <div className="bg-accent-light text-accent px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between">
          <span>{importResult}</span>
          <button onClick={() => setImportResult(null)} className="text-accent/60 hover:text-accent">x</button>
        </div>
      )}

      {/* Modale import */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowImport(false)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-primary mb-4">Importer un relevé bancaire</h3>
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImport(f); }}
            >
              <p className="text-muted mb-2">Glissez-déposez votre fichier CSV</p>
              <p className="text-xs text-muted mb-4">Formats supportés : BNP, Crédit Agricole, LCL, SG, CIC</p>
              <label className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-light">
                Parcourir
                <input type="file" accept=".csv,.ofx,.txt" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />
              </label>
            </div>
            <button onClick={() => setShowImport(false)} className="w-full mt-4 text-muted text-sm hover:text-foreground">Annuler</button>
          </div>
        </div>
      )}

      {/* Tabs + filtres */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {[
          { key: "A_CATEGORISER", label: "A catégoriser", count: counts.aCat },
          { key: "VALIDEE", label: "Validées", count: counts.val },
          { key: "IGNOREE", label: "Ignorées", count: counts.ign },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-primary text-white" : "bg-card border border-border text-muted hover:text-foreground"
            }`}>
            {t.label} {t.count > 0 && <span className="ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
        <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="ml-auto px-3 py-2 border border-border rounded-lg bg-card text-sm w-48 focus:outline-none focus:ring-2 focus:ring-accent" />
        <Link href="/banque/mots-cles" className="text-sm text-accent hover:underline">Mots-clés</Link>
      </div>

      {/* Liste transactions */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-6 animate-pulse space-y-3">
            <div className="h-4 bg-border rounded w-full" />
            <div className="h-4 bg-border rounded w-full" />
            <div className="h-4 bg-border rounded w-3/4" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted">
            <p>{tab === "A_CATEGORISER" ? "Aucune transaction à catégoriser." : "Aucune transaction."}</p>
            {tab === "A_CATEGORISER" && (
              <button onClick={() => setShowImport(true)} className="text-accent hover:underline text-sm mt-2">
                Importer un relevé
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/30">
                  <th className="text-left px-4 py-2.5 font-medium text-muted w-24">Date</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted max-w-[280px]">Libellé bancaire</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted w-28">Montant</th>
                  {showTVA && (
                    <th className="text-right px-4 py-2.5 font-medium text-muted w-24">TVA</th>
                  )}
                  <th className="text-left px-4 py-2.5 font-medium text-muted w-56">Rubrique</th>
                  {tab === "A_CATEGORISER" && (
                    <th className="text-center px-4 py-2.5 font-medium text-muted w-24">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className={`border-b border-border last:border-0 hover:bg-background/50 ${
                    tx.rubrique2035Code && tx.statut === "A_CATEGORISER" ? "bg-accent/5" : ""
                  }`}>
                    <td className="px-4 py-2.5 text-muted">{fmtDate(tx.date)}</td>
                    <td className="px-4 py-2.5 max-w-[280px]">
                      <div className="flex items-center gap-2">
                        {tx.statut === "VALIDEE" && (
                          <span className="text-success" title="Validée"><CheckCircleIcon className="w-4 h-4" /></span>
                        )}
                        {tx.statut === "IGNOREE" && (
                          <span className="text-muted" title="Ignorée"><MinusCircleIcon className="w-4 h-4" /></span>
                        )}
                        {tx.rubrique2035Code && tx.statut === "A_CATEGORISER" && (
                          <span className="text-accent text-xs" title="Catégorisé automatiquement">&#9889;</span>
                        )}
                        <span className="text-foreground truncate">{tx.libelleBancaire}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-2.5 text-right font-medium ${tx.montant >= 0 ? "text-success" : "text-danger"}`}>
                      {fmt(tx.montant)}
                    </td>
                    {showTVA && (
                      <td className="px-4 py-2.5 text-right">
                        {tab === "A_CATEGORISER" ? (
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={tx.tva ?? 0}
                            onBlur={(e) => updateTransaction(tx.id, "tva", e.target.value)}
                            className="w-20 px-2 py-1 border border-border rounded text-xs bg-background text-right"
                            placeholder="0,00"
                          />
                        ) : (
                          <span className="text-muted text-xs">
                            {tx.tva ? fmt(tx.tva) : "—"}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      {tab === "A_CATEGORISER" ? (
                        <select value={tx.rubrique2035Code || ""}
                          onChange={(e) => {
                            const code = e.target.value;
                            const rub = rubriques.find((r) => r.code === code);
                            updateTransaction(tx.id, "rubrique2035Code", code);
                            if (rub) updateTransaction(tx.id, "sens", rub.type);
                          }}
                          className="w-full px-2 py-1 border border-border rounded text-xs bg-background">
                          <option value="">—</option>
                          {rubriques.map((r) => (
                            <option key={r.code} value={r.code}>{r.code} — {r.libelle}</option>
                          ))}
                        </select>
                      ) : tx.rubrique2035 ? (
                        <span className="bg-primary-lighter text-primary text-xs px-2 py-0.5 rounded">
                          {tx.rubrique2035Code} — {tx.rubrique2035.libelle}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    {tab === "A_CATEGORISER" && (
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => validerTransaction(tx.id)}
                            disabled={!tx.rubrique2035Code}
                            className="text-success hover:bg-success/10 p-1 rounded disabled:opacity-30" title="Valider">
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => ignorerTransaction(tx.id)}
                            className="text-muted hover:text-danger hover:bg-danger/10 p-1 rounded" title="Ignorer">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
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

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MinusCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
