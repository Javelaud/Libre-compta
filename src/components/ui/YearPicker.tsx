"use client";

import { useYear } from "@/contexts/YearContext";

type Props = {
  className?: string;
};

export default function YearPicker({ className = "" }: Props) {
  const { year, setYear, available, loading } = useYear();

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-card text-sm text-muted ${className}`}>
        <CalendarIcon className="w-4 h-4" />
        <span className="animate-pulse">…</span>
      </div>
    );
  }

  return (
    <label className={`inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-card text-sm hover:border-accent transition-colors cursor-pointer ${className}`}>
      <CalendarIcon className="w-4 h-4 text-muted" />
      <span className="text-muted">Exercice</span>
      <select
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="bg-transparent text-foreground font-medium focus:outline-none cursor-pointer pr-1"
      >
        {available.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </label>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}
