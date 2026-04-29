"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Rubrique = { code: string; libelle: string; type?: string };

type Props = {
  rubriques: Rubrique[];
  value: string;
  onChange: (code: string, rubrique: Rubrique | null) => void;
  placeholder?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  filterType?: "RECETTE" | "DEPENSE" | "ALL";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
};

export default function RubriqueCombobox({
  rubriques,
  value,
  onChange,
  placeholder = "Choisir une rubrique…",
  emptyLabel = "—",
  allowEmpty = true,
  filterType = "ALL",
  size = "md",
  className = "",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredByType = useMemo(
    () => (filterType === "ALL" ? rubriques : rubriques.filter((r) => r.type === filterType)),
    [rubriques, filterType]
  );

  const selected = useMemo(
    () => filteredByType.find((r) => r.code === value) ?? rubriques.find((r) => r.code === value) ?? null,
    [filteredByType, rubriques, value]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filteredByType;
    return filteredByType.filter(
      (r) => r.libelle.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
    );
  }, [filteredByType, query]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (highlight >= matches.length) setHighlight(0);
  }, [matches, highlight]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const sizing =
    size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";

  const choose = (r: Rubrique | null) => {
    onChange(r?.code ?? "", r);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = matches[highlight];
      if (r) choose(r);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  const display = selected ? `${selected.libelle} (${selected.code})` : "";

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        type="text"
        value={open ? query : display}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => !disabled && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={selected ? "" : placeholder}
        disabled={disabled}
        readOnly={!open}
        className={`w-full ${sizing} border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 ${open ? "cursor-text" : "cursor-pointer"}`}
      />
      {open && (
        <ul
          ref={listRef}
          className="absolute z-30 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto py-1 text-sm"
        >
          {allowEmpty && (
            <li
              onMouseDown={(e) => {
                e.preventDefault();
                choose(null);
              }}
              onMouseEnter={() => setHighlight(-1)}
              className={`px-3 py-1.5 cursor-pointer text-muted ${
                value === "" ? "bg-accent/10" : "hover:bg-background"
              }`}
            >
              {emptyLabel}
            </li>
          )}
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-muted text-xs italic">Aucun résultat</li>
          ) : (
            matches.map((r, i) => (
              <li
                key={r.code}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(r);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`px-3 py-1.5 cursor-pointer flex items-center gap-2 ${
                  i === highlight ? "bg-accent/10" : "hover:bg-background"
                } ${r.code === value ? "font-medium text-primary" : ""}`}
              >
                <span className="bg-primary-lighter text-primary text-[10px] font-bold rounded px-1.5 py-0.5 min-w-[28px] text-center shrink-0">
                  {r.code}
                </span>
                <span className="truncate">{r.libelle}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
