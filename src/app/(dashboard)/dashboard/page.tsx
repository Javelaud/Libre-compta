"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Ecriture = {
  id: string;
  date: string;
  libelle: string;
  montant: number;
  sens: string;
  rubrique2035Code: string;
  rubrique2035: { code: string; libelle: string };
};

type BalanceData = {
  totalRecettes: number;
  totalDepenses: number;
  solde: number;
};

type MoisData = {
  mois: string;
  recettes: number;
  depenses: number;
};

const formatMontant = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function DashboardPage() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [ecritures, setEcritures] = useState<Ecriture[]>([]);
  const [mensuel, setMensuel] = useState<MoisData[]>([]);
  const [annee, setAnnee] = useState(0);

  useEffect(() => {
    fetch("/api/exercice/courant")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.id) return;
        setAnnee(data.annee);
        Promise.all([
          fetch(`/api/balance?exerciceId=${data.id}`).then((r) => r.json()),
          fetch(`/api/ecritures?exerciceId=${data.id}`).then((r) => r.json()),
          fetch(`/api/dashboard/mensuel?exerciceId=${data.id}`).then((r) => r.json()),
        ]).then(([bal, ecr, mens]) => {
          setBalance(bal);
          setEcritures(ecr.slice(0, 5));
          setMensuel(mens);
        });
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-1">Tableau de bord</h1>
      <p className="text-muted mb-8">
        {annee ? `Vue d'ensemble de votre exercice ${annee}` : "Chargement..."}
      </p>

      {/* KPI */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-sm text-muted mb-1">Recettes</p>
          <p className="text-3xl font-bold text-success">
            {formatMontant(balance?.totalRecettes ?? 0)}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-sm text-muted mb-1">Dépenses</p>
          <p className="text-3xl font-bold text-danger">
            {formatMontant(balance?.totalDepenses ?? 0)}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-sm text-muted mb-1">Résultat net</p>
          <p className={`text-3xl font-bold ${(balance?.solde ?? 0) >= 0 ? "text-success" : "text-danger"}`}>
            {formatMontant(balance?.solde ?? 0)}
          </p>
        </div>
      </div>

      {/* Graphique mensuel */}
      {mensuel.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="font-semibold text-primary mb-4">Recettes vs Dépenses par mois</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mensuel} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} tickFormatter={(v) => `${v} €`} />
              <Tooltip
                formatter={(value: number) => formatMontant(value)}
                labelStyle={{ fontWeight: 600 }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Legend />
              <Bar dataKey="recettes" name="Recettes" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="depenses" name="Dépenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Dernières écritures */}
      <div className="bg-card rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-primary">Dernières écritures</h2>
          <Link href="/saisie" className="text-sm text-accent hover:underline">Voir tout</Link>
        </div>
        {ecritures.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted">
            <p>Aucune écriture pour le moment.</p>
            <Link href="/saisie" className="text-accent hover:underline text-sm mt-1 inline-block">
              Commencer la saisie
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/30">
                <th className="text-left px-6 py-2.5 font-medium text-muted">Date</th>
                <th className="text-left px-6 py-2.5 font-medium text-muted">Libellé</th>
                <th className="text-left px-6 py-2.5 font-medium text-muted">Rubrique</th>
                <th className="text-right px-6 py-2.5 font-medium text-muted">Montant</th>
              </tr>
            </thead>
            <tbody>
              {ecritures.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-2.5 text-muted">{formatDate(e.date)}</td>
                  <td className="px-6 py-2.5 text-foreground">{e.libelle}</td>
                  <td className="px-6 py-2.5">
                    <span className="bg-primary-lighter text-primary text-xs px-2 py-0.5 rounded">
                      {e.rubrique2035Code}
                    </span>
                  </td>
                  <td className={`px-6 py-2.5 text-right font-medium ${e.sens === "RECETTE" ? "text-success" : "text-danger"}`}>
                    {e.sens === "RECETTE" ? "+" : "-"}{formatMontant(e.montant)}
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
