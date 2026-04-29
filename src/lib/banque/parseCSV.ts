/**
 * Parse un CSV bancaire en transactions brutes.
 * Supporte les formats courants : BNP, Crédit Agricole, LCL, SG, CIC, Banque Populaire.
 * Le séparateur est détecté automatiquement (;, , ou \t).
 */

export type TransactionBrute = {
  date: Date;
  libelle: string;
  montant: number;
};

const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "");

const normalizeHeader = (h: string) =>
  stripDiacritics(h.replace(/^﻿/, "").replace(/"/g, "").trim().toLowerCase());

export function parseCSVBancaire(content: string): TransactionBrute[] {
  // Strip BOM en tête de fichier
  const cleaned = content.replace(/^﻿/, "");
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Détecter le séparateur en cherchant celui qui fragmente le mieux la 1ère ligne
  const candidates = [";", "\t", ","];
  const sep =
    candidates
      .map((c) => ({ c, n: lines[0].split(c).length }))
      .sort((a, b) => b.n - a.n)[0].c;

  const headers = lines[0].split(sep).map(normalizeHeader);

  // Trouver les colonnes (matching par mots-clés, pas exact)
  const dateIdx = headers.findIndex((h) =>
    /\bdate\b/.test(h)
  );
  const libelleIdx = headers.findIndex((h) =>
    /libelle|description|detail|operation/.test(h)
  );

  // Montant : colonne unique ou débit/crédit séparés
  const montantIdx = headers.findIndex((h) =>
    /^montant\b|^amount\b/.test(h) && !/debit|credit/.test(h)
  );
  const debitIdx = headers.findIndex((h) => /\bdebit\b/.test(h));
  const creditIdx = headers.findIndex((h) => /\bcredit\b/.test(h));

  // Fallback positionnel si on n'a pas trouvé les colonnes essentielles
  if (dateIdx === -1 || libelleIdx === -1) {
    return parseSimple(lines.slice(1), sep);
  }

  const results: TransactionBrute[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i], sep);
    if (cols.length <= Math.max(dateIdx, libelleIdx)) continue;

    const dateStr = cols[dateIdx]?.replace(/"/g, "").trim();
    const libelle = cols[libelleIdx]?.replace(/"/g, "").trim();

    let montant = 0;
    if (montantIdx !== -1) {
      montant = parseMontant(cols[montantIdx]);
    } else if (debitIdx !== -1 || creditIdx !== -1) {
      const debit = debitIdx !== -1 ? parseMontant(cols[debitIdx]) : 0;
      const credit = creditIdx !== -1 ? parseMontant(cols[creditIdx]) : 0;
      // Le débit est une dépense (négatif), le crédit une recette (positif)
      // Si la valeur du débit est déjà négative dans le CSV, on respecte son signe.
      // Si elle est positive, on inverse le signe (convention française : valeur absolue dans la colonne débit).
      if (credit !== 0 && debit === 0) {
        montant = Math.abs(credit);
      } else if (debit !== 0 && credit === 0) {
        montant = -Math.abs(debit);
      } else if (debit !== 0 && credit !== 0) {
        // Les deux remplis : prendre la différence (cas exotique mais possible)
        montant = Math.abs(credit) - Math.abs(debit);
      }
    }

    const date = parseDate(dateStr);
    if (!date || !libelle || montant === 0) continue;

    results.push({ date, libelle, montant });
  }

  return results;
}

function parseSimple(lines: string[], sep: string): TransactionBrute[] {
  const results: TransactionBrute[] = [];
  for (const line of lines) {
    const cols = splitCSVLine(line, sep);
    if (cols.length < 3) continue;
    const date = parseDate(cols[0]?.replace(/"/g, "").trim());
    const libelle = cols[1]?.replace(/"/g, "").trim();

    let montant = 0;
    // Si on a 4+ colonnes : tenter cols[2]=débit, cols[3]=crédit (cas BNP/CA)
    if (cols.length >= 4) {
      const debit = parseMontant(cols[2]);
      const credit = parseMontant(cols[3]);
      if (credit !== 0 && debit === 0) montant = Math.abs(credit);
      else if (debit !== 0 && credit === 0) montant = -Math.abs(debit);
      else if (debit !== 0 && credit !== 0) montant = Math.abs(credit) - Math.abs(debit);
    }
    if (montant === 0) montant = parseMontant(cols[2]); // fallback : col 2 = montant signé

    if (date && libelle && montant !== 0) {
      results.push({ date, libelle, montant });
    }
  }
  return results;
}

function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === sep && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseMontant(str: string | undefined): number {
  if (!str) return 0;
  const cleaned = str.replace(/"/g, "").replace(/\s/g, "").replace(/ /g, "").replace(",", ".");
  if (!cleaned) return 0;
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseDate(str: string | undefined): Date | null {
  if (!str) return null;
  // Format DD/MM/YYYY
  const fr = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (fr) {
    const year = fr[3].length === 2 ? 2000 + parseInt(fr[3]) : parseInt(fr[3]);
    return new Date(year, parseInt(fr[2]) - 1, parseInt(fr[1]));
  }
  // Format YYYY-MM-DD
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]));
  }
  return null;
}
