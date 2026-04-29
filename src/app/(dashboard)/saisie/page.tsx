"use client";

import { useEffect, useState } from "react";
import FormulaireEcriture from "@/components/saisie/FormulaireEcriture";
import ListeEcritures from "@/components/saisie/ListeEcritures";
import { useYear } from "@/contexts/YearContext";
import YearPicker from "@/components/ui/YearPicker";

type UserProfil = { regimeTVA: string; tauxTVA: number };

export default function SaisiePage() {
  const { year } = useYear();
  const [exerciceId, setExerciceId] = useState<string | null>(null);
  const [profil, setProfil] = useState<UserProfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/exercice/courant?annee=${year}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/user/profil").then((r) => (r.ok ? r.json() : null)),
    ]).then(([ex, user]) => {
      setExerciceId(ex?.id ?? null);
      if (user) setProfil({ regimeTVA: user.regimeTVA, tauxTVA: user.tauxTVA });
      setLoading(false);
    });
  }, [year]);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-primary mb-1">Notes de frais</h1>
        <p className="text-muted mb-8">Chargement...</p>
      </div>
    );
  }

  if (!exerciceId) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-primary mb-1">Notes de frais</h1>
        <p className="text-muted mb-8">
          Impossible de charger l&apos;exercice. Vérifiez votre connexion à la base de données.
        </p>
      </div>
    );
  }

  const showTVA = profil
    ? ["REEL_MENSUEL", "REEL_TRIMESTRIEL", "REEL_ANNUEL"].includes(profil.regimeTVA)
    : false;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1">Notes de frais</h1>
          <p className="text-muted">Dépenses ou recettes payées avec votre compte personnel à prendre en charge par l&apos;activité professionnelle</p>
        </div>
        <YearPicker />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <FormulaireEcriture
          exerciceId={exerciceId}
          showTVA={showTVA}
          tauxTVA={profil?.tauxTVA ?? 20}
          onCreated={() => setRefreshKey((k) => k + 1)}
        />
        <ListeEcritures exerciceId={exerciceId} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
