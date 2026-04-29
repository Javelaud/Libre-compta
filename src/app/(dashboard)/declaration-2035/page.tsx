"use client";

import { useEffect, useState } from "react";
import type { Calcul2035 } from "@/lib/calculs2035";
import { exportDeclaration2035PDF } from "@/lib/export2035PDF";
import { useYear, YEARS_AVAILABLE } from "@/contexts/YearContext";

type Data = Calcul2035 & {
  declaration: { id: string; statut: string; validatedAt: string | null } | null;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

const CODES_RECETTES = ["BA", "BB", "BC", "BD", "BE", "BF"] as const;
const CODES_DEPENSES = [
  "BG", "BH", "BI", "BJ", "BK", "BL", "BM", "BN", "BO",
  "BP", "BQ", "BR", "BS", "BT", "BU", "BV", "BW", "BX",
  "BY", "BZ", "CA", "CB", "CC", "CD", "CE",
] as const;

export default function Declaration2035Page() {
  const { year, setYear } = useYear();
  const annee = year;
  const setAnnee = setYear;
  const annees = YEARS_AVAILABLE;
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fetchData = (a: number) => {
    setLoading(true);
    fetch(`/api/declaration-2035?annee=${a}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(annee);
  }, [annee]);

  const valider = async () => {
    setBusy(true);
    const action = data?.declaration?.statut === "VALIDEE" ? "devalidate" : "validate";
    const res = await fetch(`/api/declaration-2035?annee=${annee}&action=${action}`, { method: "POST" });
    if (res.ok) fetchData(annee);
    setBusy(false);
  };

  const exporter = () => {
    if (data) exportDeclaration2035PDF(data);
  };

  if (loading || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-primary mb-1">Déclaration 2035</h1>
        <div className="bg-card rounded-xl border border-border p-6 mt-4">
          <div className="h-4 bg-border rounded animate-pulse mb-3" />
          <div className="h-4 bg-border rounded animate-pulse w-3/4 mb-3" />
          <div className="h-4 bg-border rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  const { recettes, depenses, resultat, contribuable, rubriques, declaration } = data;
  const rubByCode = Object.fromEntries(rubriques.map((r) => [r.code, r.libelle]));
  const isValidated = declaration?.statut === "VALIDEE";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1">Déclaration 2035</h1>
          <p className="text-muted">Revenus non commerciaux — Génération automatique</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={annee}
            onChange={(e) => setAnnee(Number(e.target.value))}
            className="px-3 py-2 border border-border rounded-lg bg-card text-sm"
          >
            {annees.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={exporter}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
            title="Télécharger en PDF"
          >
            Exporter en PDF
          </button>
          <button
            onClick={valider}
            disabled={busy}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              isValidated
                ? "border border-danger text-danger hover:bg-danger hover:text-white"
                : "bg-success text-white hover:opacity-90"
            }`}
          >
            {isValidated ? "Dévalider" : "Valider la déclaration"}
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 text-sm">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isValidated ? "bg-success/15 text-success" : "bg-amber-100 text-amber-800"
          }`}
        >
          {isValidated ? "✓ Validée" : "Brouillon"}
        </span>
        {declaration?.validatedAt && (
          <span className="text-muted">
            Validée le {new Date(declaration.validatedAt).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <h2 className="text-sm font-semibold text-primary mb-3">Contribuable</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Field label="Nom" value={contribuable.nom} />
          <Field label="SIRET" value={contribuable.siret || "—"} />
          <Field label="Profession" value={contribuable.profession || "—"} />
          <Field label="Année fiscale" value={String(contribuable.annee)} />
        </div>
      </div>

      <Section title="Cadre A — Recettes professionnelles">
        {CODES_RECETTES.map((c) => (
          <Ligne key={c} code={c} libelle={rubByCode[c]} montant={recettes[c]} />
        ))}
        <LigneTotal label="TOTAL RECETTES (1)" montant={recettes.totalRecettes} />
      </Section>

      <Section title="Cadre B — Dépenses professionnelles">
        {CODES_DEPENSES.map((c) => (
          <Ligne key={c} code={c} libelle={rubByCode[c]} montant={depenses[c]} />
        ))}
        <LigneTotal label="TOTAL DÉPENSES (2)" montant={depenses.totalDepenses} />
      </Section>

      <div
        className={`rounded-xl p-6 mt-4 ${
          resultat.estBeneficiaire
            ? "bg-success/10 border border-success/30"
            : "bg-danger/10 border border-danger/30"
        }`}
      >
        <p className={`text-xs font-medium uppercase tracking-wide ${resultat.estBeneficiaire ? "text-success" : "text-danger"}`}>
          Cadre C — Résultat
        </p>
        <div className="flex items-end justify-between mt-2">
          <p className={`text-lg font-semibold ${resultat.estBeneficiaire ? "text-success" : "text-danger"}`}>
            {resultat.estBeneficiaire ? "BÉNÉFICE NET (1) − (2)" : "DÉFICIT NET (2) − (1)"}
          </p>
          <p className={`text-3xl font-bold ${resultat.estBeneficiaire ? "text-success" : "text-danger"}`}>
            {fmt(resultat.estBeneficiaire ? resultat.beneficeNet : resultat.deficitNet)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
      <div className="px-5 py-3 bg-primary text-white text-sm font-semibold">{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Ligne({ code, libelle, montant }: { code: string; libelle: string; montant: number }) {
  const isZero = montant === 0;
  return (
    <div className={`flex items-center gap-3 px-5 py-2 border-b border-border last:border-0 ${isZero ? "text-muted" : "text-foreground"}`}>
      <span className="bg-primary-lighter text-primary text-xs font-bold rounded px-2 py-0.5 w-10 text-center">{code}</span>
      <span className="flex-1 text-sm">{libelle}</span>
      <span className={`text-sm tabular-nums ${isZero ? "" : "font-bold"}`}>
        {isZero ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(montant)}
      </span>
    </div>
  );
}

function LigneTotal({ label, montant }: { label: string; montant: number }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-primary-lighter/40 border-t border-border font-bold text-primary">
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-sm tabular-nums">
        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(montant)}
      </span>
    </div>
  );
}
