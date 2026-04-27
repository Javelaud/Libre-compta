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

export function parseCSVBancaire(content: string): TransactionBrute[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Détecter le séparateur
  const firstLine = lines[0];
  const sep = firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : ",";

  const headers = lines[0].split(sep).map((h) => h.replace(/"/g, "").trim().toLowerCase());

  // Trouver les colonnes
  const dateIdx = headers.findIndex((h) =>
    ["date", "date opération", "date operation", "date comptable", "date valeur"].includes(h)
  );
  const libelleIdx = headers.findIndex((h) =>
    ["libellé", "libelle", "description", "libellé opération", "libelle operation", "détail", "detail"].includes(h)
  );

  // Montant : colonne unique ou débit/crédit séparés
  const montantIdx = headers.findIndex((h) =>
    ["montant", "montant (eur)", "montant(eur)", "amount"].includes(h)
  );
  const debitIdx = headers.findIndex((h) =>
    ["débit", "debit", "débit (eur)", "debit (eur)"].includes(h)
  );
  const creditIdx = headers.findIndex((h) =>
    ["crédit", "credit", "crédit (eur)", "credit (eur)"].includes(h)
  );

  if (dateIdx === -1 || libelleIdx === -1) {
    // Fallback : essayer col 0 = date, col 1 = libellé, col 2 = montant
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
      montant = credit > 0 ? credit : -Math.abs(debit);
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
    const montant = parseMontant(cols[2]);
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
  const cleaned = str.replace(/"/g, "").replace(/\s/g, "").replace(",", ".");
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
