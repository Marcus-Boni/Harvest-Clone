import * as XLSX from "xlsx";

interface TimeEntryRow {
  date: string;
  project: string;
  description: string;
  duration: number; // minutes
  billable: boolean;
  status: string;
  azureWorkItemId?: number | null;
  azureWorkItemTitle?: string | null;
}

function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

/**
 * Generate and download an Excel (.xlsx) file of time entries.
 */
export function exportTimeEntriesToExcel(
  entries: TimeEntryRow[],
  filename = "timesheet-export",
) {
  const rows = entries.map((e) => ({
    Data: e.date,
    Projeto: e.project,
    Descrição: e.description,
    Horas: minutesToHours(e.duration),
    Faturável: e.billable ? "Sim" : "Não",
    Status: translateStatus(e.status),
    "Work Item ID": e.azureWorkItemId ?? "",
    "Work Item Título": e.azureWorkItemTitle ?? "",
  }));

  // Totals row
  const totalHours = minutesToHours(
    entries.reduce((sum, e) => sum + e.duration, 0),
  );
  const billableHours = minutesToHours(
    entries.filter((e) => e.billable).reduce((sum, e) => sum + e.duration, 0),
  );
  rows.push({
    Data: "",
    Projeto: "",
    Descrição: "TOTAL",
    Horas: totalHours,
    Faturável: `${billableHours} faturável`,
    Status: "",
    "Work Item ID": "",
    "Work Item Título": "",
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 12 },
    { wch: 24 },
    { wch: 36 },
    { wch: 8 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Group entries by project and generate an Excel summary.
 */
export function exportSummaryByProjectToExcel(
  projectData: {
    projectName: string;
    totalMinutes: number;
    billableMinutes: number;
    entryCount: number;
  }[],
  {
    filename = "resumo-projetos",
    period,
    totalMinutes,
    billableMinutes,
  }: {
    filename?: string;
    period?: string;
    totalMinutes?: number;
    billableMinutes?: number;
  } = {},
) {
  const rows: Record<string, string | number>[] = projectData.map((p) => ({
    Projeto: p.projectName,
    "Total (h)": minutesToHours(p.totalMinutes),
    "Faturável (h)": minutesToHours(p.billableMinutes),
    "Não Faturável (h)": minutesToHours(p.totalMinutes - p.billableMinutes),
    Lançamentos: p.entryCount,
  }));

  // Totals row
  const grandTotal =
    totalMinutes ?? projectData.reduce((s, p) => s + p.totalMinutes, 0);
  const grandBillable =
    billableMinutes ?? projectData.reduce((s, p) => s + p.billableMinutes, 0);
  rows.push({
    Projeto: "TOTAL",
    "Total (h)": minutesToHours(grandTotal),
    "Faturável (h)": minutesToHours(grandBillable),
    "Não Faturável (h)": minutesToHours(grandTotal - grandBillable),
    Lançamentos: projectData.reduce((s, p) => s + p.entryCount, 0),
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 32 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = period ? `Resumo ${period}` : "Resumo por Projeto";
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
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
