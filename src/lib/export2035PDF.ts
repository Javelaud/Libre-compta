import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Calcul2035 } from "@/lib/calculs2035";

const fmt = (n: number) =>
  n === 0
    ? "—"
    : new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
      }).format(n);

const NAVY: [number, number, number] = [30, 58, 95];
const NAVY_LIGHT: [number, number, number] = [232, 238, 247];
const GREEN: [number, number, number] = [34, 139, 94];
const RED: [number, number, number] = [192, 50, 50];

export function exportDeclaration2035PDF(data: Calcul2035) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const { contribuable, recettes, depenses, resultat, rubriques } = data;

  // En-tête
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("DÉCLARATION 2035", 14, 14);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Revenus non commerciaux — Année ${contribuable.annee}`, 14, 21);

  // Bloc contribuable
  doc.setTextColor(0);
  doc.setFontSize(10);
  let y = 36;
  const lines = [
    `Contribuable : ${contribuable.nom || "—"}`,
    `SIRET : ${contribuable.siret || "—"}`,
    `Profession : ${contribuable.profession || "—"}`,
  ];
  for (const l of lines) {
    doc.text(l, 14, y);
    y += 5;
  }
  y += 4;

  const rubByCode = Object.fromEntries(rubriques.map((r) => [r.code, r.libelle]));

  // Cadre A — Recettes
  const codesR = ["BA", "BB", "BC", "BD", "BE", "BF"] as const;
  const recettesRows = codesR.map((c) => [
    c,
    rubByCode[c] ?? "",
    fmt(recettes[c]),
  ]);
  recettesRows.push([
    { content: "TOTAL RECETTES", colSpan: 2, styles: { fontStyle: "bold", fillColor: NAVY_LIGHT } },
    { content: fmt(recettes.totalRecettes), styles: { fontStyle: "bold", fillColor: NAVY_LIGHT, halign: "right" } },
  ] as never);

  autoTable(doc, {
    startY: y,
    head: [["Cadre A — Recettes professionnelles", "", ""]],
    body: recettesRows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold", halign: "left" },
    columnStyles: { 0: { cellWidth: 16, fontStyle: "bold" }, 2: { halign: "right", cellWidth: 36 } },
  });

  // Cadre B — Dépenses
  const codesD = [
    "BG", "BH", "BI", "BJ", "BK", "BL", "BM", "BN", "BO",
    "BP", "BQ", "BR", "BS", "BT", "BU", "BV", "BW", "BX",
    "BY", "BZ", "CA", "CB", "CC", "CD", "CE",
  ] as const;
  const depensesRows = codesD.map((c) => [
    c,
    rubByCode[c] ?? "",
    fmt(depenses[c]),
  ]);
  depensesRows.push([
    { content: "TOTAL DÉPENSES", colSpan: 2, styles: { fontStyle: "bold", fillColor: NAVY_LIGHT } },
    { content: fmt(depenses.totalDepenses), styles: { fontStyle: "bold", fillColor: NAVY_LIGHT, halign: "right" } },
  ] as never);

  type DocWithLast = jsPDF & { lastAutoTable?: { finalY: number } };
  const lastY1 = (doc as DocWithLast).lastAutoTable?.finalY ?? y;
  autoTable(doc, {
    startY: lastY1 + 6,
    head: [["Cadre B — Dépenses professionnelles", "", ""]],
    body: depensesRows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold", halign: "left" },
    columnStyles: { 0: { cellWidth: 16, fontStyle: "bold" }, 2: { halign: "right", cellWidth: 36 } },
  });

  // Cadre C — Résultat
  const lastY2 = (doc as DocWithLast).lastAutoTable?.finalY ?? lastY1;
  const yResult = lastY2 + 8;
  if (yResult > 260) doc.addPage();
  const yR = yResult > 260 ? 20 : yResult;

  doc.setFillColor(...(resultat.estBeneficiaire ? GREEN : RED));
  doc.rect(14, yR, pageWidth - 28, 18, "F");
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const resLabel = resultat.estBeneficiaire ? "BÉNÉFICE NET" : "DÉFICIT NET";
  const resVal = resultat.estBeneficiaire ? resultat.beneficeNet : resultat.deficitNet;
  doc.text(`${resLabel} :`, 18, yR + 11);
  doc.setFontSize(14);
  doc.text(fmt(resVal), pageWidth - 18, yR + 11, { align: "right" });

  // Pied de page
  doc.setTextColor(120);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Généré par Libre Compta le ${new Date().toLocaleDateString("fr-FR")}`,
    14,
    doc.internal.pageSize.getHeight() - 8
  );

  doc.save(`declaration-2035-${contribuable.annee}.pdf`);
}
