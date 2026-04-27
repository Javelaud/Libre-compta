"use client";

import { useEffect, useState } from "react";

/**
 * Hook temporaire : retourne un exerciceId fictif en dev.
 * Sera remplacé par un vrai hook session + exercice en Session 6.
 */
export function useExercice() {
  const [exerciceId, setExerciceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // En dev, on utilise l'exercice créé par le seed ou le premier trouvé
    fetch("/api/exercice/courant")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) setExerciceId(data.id);
      })
      .finally(() => setLoading(false));
  }, []);

  return { exerciceId, loading };
}
