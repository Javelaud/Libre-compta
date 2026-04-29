"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "libre-compta-selected-year";

type Ctx = {
  year: number;
  setYear: (y: number) => void;
  available: number[];
  loading: boolean;
};

const YearContext = createContext<Ctx | null>(null);

export function YearProvider({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();
  const [year, setYearState] = useState<number>(currentYear);
  const [available, setAvailable] = useState<number[]>([currentYear]);
  const [loading, setLoading] = useState(true);

  // Charge la liste dynamique des années depuis l'API
  useEffect(() => {
    fetch("/api/exercice/list")
      .then((r) => (r.ok ? r.json() : [currentYear]))
      .then((years: number[]) => {
        const list = years.length > 0 ? years : [currentYear];
        setAvailable(list);

        // Restaure le choix précédent si valide, sinon prend la plus récente
        if (typeof window !== "undefined") {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          const savedNum = saved ? Number(saved) : NaN;
          if (savedNum && list.includes(savedNum)) {
            setYearState(savedNum);
          } else {
            setYearState(list[0]);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setAvailable([currentYear]);
        setYearState(currentYear);
        setLoading(false);
      });
  }, [currentYear]);

  const setYear = (y: number) => {
    setYearState(y);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(y));
    }
  };

  return (
    <YearContext.Provider value={{ year, setYear, available, loading }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear(): Ctx {
  const ctx = useContext(YearContext);
  if (!ctx) throw new Error("useYear must be used inside YearProvider");
  return ctx;
}
