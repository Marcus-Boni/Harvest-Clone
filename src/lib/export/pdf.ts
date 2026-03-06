import jsPDF from "jspdf";

interface TimeEntryRow {
  date: string;
  project: string;
  description: string;
  duration: number; // minutes
  billable: boolean;
  status: string;
}

const BRAND = [249, 115, 22] as const;
const HEADER_TEXT = [255, 255, 255] as const;
const ALT_ROW = [248, 248, 248] as const;
const WHITE = [255, 255, 255] as const;
const TEXT = [30, 30, 30] as const;
const TOTALS_BG = [240, 240, 240] as const;

function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function translateStatus(status: string): string {
  const map: Record<string, string> = {
    draft: "Rascunho",
    submitted: "Submetido",
    approved: "Aprovado",
    rejected: "Rejeitado",
  };
  return map[status] ?? status;
}

function drawTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  startX: number,
  startY: number,
  rowHeight = 8,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const tableWidth = pageWidth - 2 * startX;
  let y = startY;

  // Header row
  doc.setFillColor(...BRAND);
  doc.rect(startX, y, tableWidth, rowHeight, "F");
  doc.setTextColor(...HEADER_TEXT);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  let x = startX;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + 2, y + rowHeight - 2);
    x += colWidths[i];
  }
  y += rowHeight;

  // Data rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (let r = 0; r < rows.length; r++) {
    if (y + rowHeight > pageHeight - 10) {
      doc.addPage();
      y = 14;
    }

    // Last row gets totals background
    const isTotalsRow = r === rows.length - 1 && rows[r][0] === "TOTAL";
    if (isTotalsRow) {
      doc.setFillColor(...TOTALS_BG);
      doc.setFont("helvetica", "bold");
    } else if (r % 2 === 1) {
      doc.setFillColor(...ALT_ROW);
    } else {
      doc.setFillColor(...WHITE);
    }

    doc.rect(startX, y, tableWidth, rowHeight, "F");
    doc.setTextColor(...TEXT);
    x = startX;
    for (let i = 0; i < rows[r].length; i++) {
      const cell = (rows[r][i] ?? "").toString();
      const maxChars = Math.floor(colWidths[i] / 2.2);
      const text =
        cell.length > maxChars ? `${cell.slice(0, maxChars - 1)}…` : cell;
      doc.text(text, x + 2, y + rowHeight - 2);
      x += colWidths[i];
    }

    if (isTotalsRow) {
      doc.setFont("helvetica", "normal");
    }
    y += rowHeight;
  }

  return y;
}

/**
 * Generate and download a PDF summary by project.
 */
export function exportSummaryByProjectToPDF({
  projectData,
  title = "Relatório de Horas",
  period,
  filename = "resumo-projetos",
  totalMinutes,
  billableMinutes,
}: {
  projectData: {
    projectName: string;
    totalMinutes: number;
    billableMinutes: number;
    entryCount: number;
  }[];
  title?: string;
  period?: string;
  filename?: string;
  totalMinutes?: number;
  billableMinutes?: number;
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT);
  doc.text(title, 14, 16);

  let headerY = 22;
  if (period) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(period, 14, headerY);
    headerY += 6;
  }

  // Summary line
  const grandTotal =
    totalMinutes ?? projectData.reduce((s, p) => s + p.totalMinutes, 0);
  const grandBillable =
    billableMinutes ?? projectData.reduce((s, p) => s + p.billableMinutes, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Total: ${minutesToHours(grandTotal)}  |  Faturável: ${minutesToHours(grandBillable)}  |  Não Faturável: ${minutesToHours(grandTotal - grandBillable)}`,
    14,
    headerY,
  );
  headerY += 7;

  const tableWidth = pageWidth - 28;
  const colWidths = [tableWidth - 96, 24, 24, 24, 24];

  const dataRows: string[][] = projectData.map((p) => [
    p.projectName,
    minutesToHours(p.totalMinutes),
    minutesToHours(p.billableMinutes),
    minutesToHours(p.totalMinutes - p.billableMinutes),
    String(p.entryCount),
  ]);

  // Totals row
  dataRows.push([
    "TOTAL",
    minutesToHours(grandTotal),
    minutesToHours(grandBillable),
    minutesToHours(grandTotal - grandBillable),
    String(projectData.reduce((s, p) => s + p.entryCount, 0)),
  ]);

  drawTable(
    doc,
    ["Projeto", "Total", "Faturável", "Não Faturável", "Lançamentos"],
    dataRows,
    colWidths,
    14,
    headerY,
  );

  doc.save(`${filename}.pdf`);
}

/**
 * Generate and download a PDF report of time entries.
 */
export function exportTimeEntriesToPDF({
  entries,
  title = "Relatório de Lançamentos",
  period,
  filename = "timesheet-export",
}: {
  entries: TimeEntryRow[];
  title?: string;
  period?: string;
  filename?: string;
}) {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth(); // ~297mm

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT);
  doc.text(title, 14, 18);

  let headerY = period ? 26 : 22;

  if (period) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(period, 14, 26);
    headerY = 32;
  }

  const totalMins = entries.reduce((s, e) => s + e.duration, 0);
  const billableMins = entries
    .filter((e) => e.billable)
    .reduce((s, e) => s + e.duration, 0);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Total: ${minutesToHours(totalMins)}  |  Faturável: ${minutesToHours(billableMins)}`,
    14,
    headerY,
  );
  headerY += 6;

  // Landscape: ~269mm usable width (297 - 14*2)
  const tableWidth = pageWidth - 28;
  const colWidths = [22, 55, tableWidth - 22 - 55 - 22 - 20 - 22, 22, 20, 22];

  const dataRows: string[][] = entries.map((e) => [
    e.date,
    e.project,
    e.description,
    minutesToHours(e.duration),
    e.billable ? "Sim" : "Não",
    translateStatus(e.status),
  ]);

  dataRows.push([
    "",
    "",
    "TOTAL",
    minutesToHours(totalMins),
    `${minutesToHours(billableMins)} fat.`,
    "",
  ]);

  drawTable(
    doc,
    ["Data", "Projeto", "Descrição", "Duração", "Faturável", "Status"],
    dataRows,
    colWidths,
    14,
    headerY,
  );

  doc.save(`${filename}.pdf`);
}
