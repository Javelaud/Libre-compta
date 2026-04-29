"use client";

import { useEffect, useState } from "react";

type Solde = { annee: number; montant: number | null };
type Status = "idle" | "saving" | "saved" | "error";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

const parseFr = (s: string): number | null => {
  const cleaned = s.replace(/\s/g, "").replace(/€/g, "").replace(",", ".").trim();
  if (!cleaned || cleaned === "-") return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
};

export default function SoldesInitiauxSection() {
  const [soldes, setSoldes] = useState<Solde[]>([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<number, Status>>({});
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [proposals, setProposals] = useState<Record<number, number>>({});

  const load = () => {
    setLoading(true);
    fetch("/api/banque/soldes-initiaux")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Solde[]) => {
        setSoldes(data);
        const ds: Record<number, string> = {};
        for (const s of data) {
          ds[s.annee] = s.montant !== null ? formatInput(s.montant) : "";
        }
        setDrafts(ds);
        setStatuses({});
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Récupère le solde calculé fin (N-1) pour proposer une reprise
  useEffect(() => {
    const fetchProposals = async () => {
      const props: Record<number, number> = {};
      for (const s of soldes) {
        if (s.montant !== null) continue; // déjà saisi
        const yearPrev = s.annee - 1;
        const hasPrev = soldes.find((x) => x.annee === yearPrev);
        if (!hasPrev) continue;
        const res = await fetch(`/api/banque/solde-final?annee=${yearPrev}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (typeof data.soldeFinal === "number") {
          props[s.annee] = data.soldeFinal;
        }
      }
      setProposals(props);
    };
    if (soldes.length > 0) fetchProposals();
  }, [soldes]);

  const save = async (annee: number, valStr: string) => {
    const montant = parseFr(valStr);
    if (montant === null) {
      setStatuses((s) => ({ ...s, [annee]: "idle" }));
      return;
    }
    setStatuses((s) => ({ ...s, [annee]: "saving" }));
    const res = await fetch("/api/banque/soldes-initiaux", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ annee, montant }),
    });
    if (res.ok) {
      setStatuses((s) => ({ ...s, [annee]: "saved" }));
      setSoldes((cur) => cur.map((c) => (c.annee === annee ? { ...c, montant } : c)));
      // Efface la proposition pour cette année
      setProposals((p) => {
        const cp = { ...p };
        delete cp[annee];
        return cp;
      });
      setTimeout(() => {
        setStatuses((s) => (s[annee] === "saved" ? { ...s, [annee]: "idle" } : s));
      }, 2500);
    } else {
      setStatuses((s) => ({ ...s, [annee]: "error" }));
    }
  };

  const useProposal = (annee: number) => {
    const value = proposals[annee];
    if (value === undefined) return;
    const formatted = formatInput(value);
    setDrafts((d) => ({ ...d, [annee]: formatted }));
    save(annee, formatted);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold text-primary mb-2">Compte professionnel</h2>
        <p className="text-sm text-muted">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="font-semibold text-primary mb-1">Compte professionnel</h2>
      <p className="text-xs text-muted mb-4">
        Soldes au 1er janvier de chaque exercice — utilisés pour calculer le solde
        progressif sur la page Banque. Format : 12 345,67 € (les négatifs sont autorisés).
      </p>

      {soldes.length === 0 ? (
        <p className="text-sm text-muted italic py-3">
          Importez un relevé bancaire pour faire apparaître les années à renseigner.
        </p>
      ) : (
        <div className="overflow-hidden border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background/40">
                <th className="px-4 py-2 text-left font-medium text-muted w-24">Année</th>
                <th className="px-4 py-2 text-right font-medium text-muted">Solde au 01/01</th>
                <th className="px-4 py-2 text-left font-medium text-muted w-48">Statut</th>
              </tr>
            </thead>
            <tbody>
              {soldes.map((s) => {
                const status = statuses[s.annee] ?? "idle";
                const proposal = proposals[s.annee];
                return (
                  <tr key={s.annee} className="border-t border-border">
                    <td className="px-4 py-2.5 font-medium text-foreground">{s.annee}</td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={drafts[s.annee] ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [s.annee]: e.target.value }))}
                        onBlur={(e) => save(s.annee, e.target.value)}
                        placeholder="—"
                        className="w-40 px-2 py-1.5 border border-border rounded text-right tabular-nums bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <span className="ml-1 text-muted">€</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {status === "saving" && <span className="text-muted">Enregistrement…</span>}
                      {status === "saved" && <span className="text-success">✓ Enregistré</span>}
                      {status === "error" && <span className="text-danger">Erreur</span>}
                      {status === "idle" && s.montant !== null && (
                        <span className="text-success/70">✓ {fmt(s.montant)}</span>
                      )}
                      {status === "idle" && s.montant === null && proposal === undefined && (
                        <span className="text-muted">— Non renseigné</span>
                      )}
                      {status === "idle" && s.montant === null && proposal !== undefined && (
                        <button
                          onClick={() => useProposal(s.annee)}
                          className="text-accent hover:underline text-left"
                          title={`Reprendre le solde calculé fin ${s.annee - 1}`}
                        >
                          💡 Reprendre {fmt(proposal)} de fin {s.annee - 1}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatInput(n: number): string {
  // Formate en "12345,67" (sans les espaces — le user peut taper soit avec, soit sans)
  return n.toString().replace(".", ",");
}
