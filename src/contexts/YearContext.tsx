"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "libre-compta-selected-year";
const DEFAULT_YEAR = 2025;
export const YEARS_AVAILABLE = Array.from({ length: 16 }, (_, i) => 2025 - i); // 2025 → 2010

type Ctx = {
  year: number;
  setYear: (y: number) => void;
};

const YearContext = createContext<Ctx | null>(null);

export function YearProvider({ children }: { children: React.ReactNode }) {
  const [year, setYearState] = useState<number>(DEFAULT_YEAR);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const n = Number(saved);
      if (YEARS_AVAILABLE.includes(n)) setYearState(n);
    }
  }, []);

  const setYear = (y: number) => {
    setYearState(y);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(y));
    }
  };

  return <YearContext.Provider value={{ year, setYear }}>{children}</YearContext.Provider>;
}

export function useYear(): Ctx {
  const ctx = useContext(YearContext);
  if (!ctx) throw new Error("useYear must be used inside YearProvider");
  return ctx;
}
