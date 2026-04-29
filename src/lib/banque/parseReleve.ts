/**
 * Parse un relevé bancaire au format CSV ou XLSX.
 * Détecte automatiquement les colonnes Date / Libellé / Débit / Crédit (ou Montant).
 *
 * Supporte les variantes :
 *  - en-têtes texte (Date, Libellé, Débit, Crédit)
 *  - en-têtes accentués / casse / avec libellés étendus
 *  - lignes de préambule avant l'en-tête (compte, période, etc.)
 *  - colonnes Débit/Crédit séparées OU une seule colonne Montant signée
 */

import * as XLSX from "xlsx";

export type TransactionBrute = {
  date: Date;
  libelle: string;
  montant: number;
};

const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "");

const normalizeHeader = (h: string) =>
  stripDiacritics(
    h.replace(/^﻿/, "").replace(/"/g, "").trim().toLowerCase()
  );

export async function parseRelevéBancaire(
  buffer: ArrayBuffer
): Promise<TransactionBrute[]> {
  // Détecter XLSX (commence par "PK", magic bytes ZIP) vs CSV (texte)
  const bytes = new Uint8Array(buffer);
  const isXlsx = bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;

  let workbook: XLSX.WorkBook;
  if (isXlsx) {
    workbook = XLSX.read(bytes, { type: "array", raw: false, cellDates: true });
  } else {
    // CSV : décoder en UTF-8 d'abord pour éviter le mojibake sur les accents
    // (SheetJS lit par défaut en latin-1 pour les chaînes octets)
    const text = new TextDecoder("utf-8").decode(buffer).replace(/^﻿/, "");
    workbook = XLSX.read(text, { type: "string", raw: false, cellDates: true });
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];

  // header: 1 → tableau de tableaux (chaque ligne = array de cellules)
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });

  if (rows.length < 2) return [];

  // Localiser la ligne d'en-tête (cherche dans les 8 premières lignes une ligne
  // contenant à la fois une cellule "date" et une cellule "libellé/description")
  let headerRowIdx = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(8, rows.length); i++) {
    const cells = rows[i].map((c) => normalizeHeader(String(c ?? "")));
    const hasDate = cells.some((h) => /\bdate\b/.test(h));
    const hasLibelle = cells.some((h) =>
      /libelle|description|detail|operation|nature/.test(h)
    );
    if (hasDate && hasLibelle) {
      headerRowIdx = i;
      headers = cells;
      break;
    }
  }

  if (headerRowIdx === -1) {
    // Pas d'en-tête repéré : suppose que la ligne 0 est l'en-tête
    headerRowIdx = 0;
    headers = rows[0].map((c) => normalizeHeader(String(c ?? "")));
  }

  // Mapping des colonnes par mot-clé
  const dateIdx = headers.findIndex((h) => /\bdate\b/.test(h));
  const libelleIdx = headers.findIndex((h) =>
    /libelle|description|detail|operation|nature/.test(h)
  );

  // Montant unique vs Débit/Crédit séparés
  const montantIdx = headers.findIndex(
    (h) => /^montant\b|^amount\b/.test(h) && !/debit|credit/.test(h)
  );
  const debitIdx = headers.findIndex((h) => /\bdebit\b/.test(h));
  const creditIdx = headers.findIndex((h) => /\bcredit\b/.test(h));

  // Si on n'a ni date ni libellé, on tente un fallback positionnel
  // (col 0 = date, col 1 = libellé, col 2 = débit, col 3 = crédit)
  const useFallback = dateIdx === -1 || libelleIdx === -1;

  const results: TransactionBrute[] = [];

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const cell = (idx: number): string => {
      if (idx < 0 || idx >= row.length) return "";
      const v = row[idx];
      if (v instanceof Date) {
        return `${String(v.getDate()).padStart(2, "0")}/${String(v.getMonth() + 1).padStart(2, "0")}/${v.getFullYear()}`;
      }
      return String(v ?? "").trim();
    };

    const dateStr = useFallback ? cell(0) : cell(dateIdx);
    const libelle = useFallback ? cell(1) : cell(libelleIdx);
    const date = parseDate(dateStr);

    if (!date || !libelle) continue;

    let montant = 0;
    if (!useFallback && montantIdx !== -1) {
      montant = parseMontant(cell(montantIdx));
    } else if (
      !useFallback &&
      (debitIdx !== -1 || creditIdx !== -1)
    ) {
      const debit = debitIdx !== -1 ? parseMontant(cell(debitIdx)) : 0;
      const credit = creditIdx !== -1 ? parseMontant(cell(creditIdx)) : 0;
      montant = computeMontant(debit, credit);
    } else if (useFallback && row.length >= 4) {
      const debit = parseMontant(cell(2));
      const credit = parseMontant(cell(3));
      montant = computeMontant(debit, credit);
    } else if (useFallback) {
      montant = parseMontant(cell(2));
    }

    if (montant === 0) continue;

    results.push({ date, libelle, montant });
  }

  return results;
}

// Convention française : la colonne Débit contient des valeurs ABSOLUES
// (positives) qui sont en réalité des dépenses → négatives.
// Si l'export bancaire les exporte déjà négatives, on respecte le signe.
function computeMontant(debit: number, credit: number): number {
  if (credit !== 0 && debit === 0) return Math.abs(credit);
  if (debit !== 0 && credit === 0) return -Math.abs(debit);
  if (debit !== 0 && credit !== 0) {
    // Cas exotique : les deux remplis. On prend la différence.
    return Math.abs(credit) - Math.abs(debit);
  }
  return 0;
}

function parseMontant(str: string): number {
  if (!str) return 0;
  // Retire guillemets, espaces normaux + insécables, puis remplace virgule
  // décimale par point. Retire aussi les points utilisés comme milliers
  // SI ils sont suivis de plus de 2 chiffres (ex: "1.234,56" → "1234,56" → "1234.56").
  let cleaned = str
    .replace(/"/g, "")
    .replace(/[\s ]/g, "")
    .replace(/€/g, "");

  // Format européen "1.234,56" → "1234.56"
  if (/\d\.\d{3}(?:[.,]|$)/.test(cleaned) && cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    cleaned = cleaned.replace(",", ".");
  }

  if (!cleaned) return 0;
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const trimmed = str.trim();
  // Format DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  const fr = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (fr) {
    const year =
      fr[3].length === 2 ? 2000 + parseInt(fr[3]) : parseInt(fr[3]);
    return new Date(year, parseInt(fr[2]) - 1, parseInt(fr[1]));
  }
  // Format ISO YYYY-MM-DD
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(
      parseInt(iso[1]),
      parseInt(iso[2]) - 1,
      parseInt(iso[3])
    );
  }
  return null;
}
