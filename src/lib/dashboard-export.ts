import { formatDateBR, formatLocalDateISO, parseLocalDate } from "./dates";

export interface DashboardExportData {
  alertas: { recordId: string; tipo: string; nome: string; situacao: string; data: string; dias: number }[];
  estagios: { id: string; nome: string; instituicao: string; termino: string; dias: number }[];
  ferias: { id: string; nome: string; inicio: string; dias: number }[];
  filters: { periodo: string; vinculo: string; status: string };
}

// Excel serializes Date values as UTC; reconstruct civil components without shifting the stored date.
export function excelDate(value: string) {
  const local = parseLocalDate(value);
  return local ? new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate())) : null;
}

export async function createDashboardWorkbook(data: DashboardExportData, generatedAt = new Date()) {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  book.creator = "Gestor de Equipe";
  book.created = generatedAt;
  const blocks = [
    { name: "Alertas operacionais", headers: ["Tipo", "Nome", "Situação", "Data", "Dias restantes"], dateColumn: 4,
      rows: data.alertas.map((a) => [a.tipo, a.nome, a.situacao, excelDate(a.data), a.dias]) },
    { name: "Estágios a vencer", headers: ["Colaborador", "Instituição", "Data de término", "Dias restantes"], dateColumn: 3,
      rows: data.estagios.map((e) => [e.nome, e.instituicao, excelDate(e.termino), e.dias]) },
    { name: "Próximas férias", headers: ["Colaborador", "Data de início", "Dias restantes"], dateColumn: 2,
      rows: data.ferias.map((f) => [f.nome, excelDate(f.inicio), f.dias]) },
  ];
  for (const block of blocks) {
    const sheet = book.addWorksheet(block.name);
    sheet.mergeCells(1, 1, 1, block.headers.length);
    sheet.getCell(1, 1).value = block.name;
    sheet.getCell(1, 1).font = { name: "Arial", size: 16, bold: true, color: { argb: "FF2957A4" } };
    sheet.getRow(1).height = 28;
    sheet.mergeCells(2, 1, 2, block.headers.length);
    sheet.getCell(2, 1).value = `Gerado em: ${formatDateBR(formatLocalDateISO(generatedAt))} ${generatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    sheet.mergeCells(3, 1, 3, block.headers.length);
    sheet.getCell(3, 1).value = `Período: ${data.filters.periodo} | Vínculo: ${data.filters.vinculo} | Status: ${data.filters.status}`;
    sheet.getCell(3, 1).alignment = { wrapText: true, vertical: "middle" };
    sheet.getRow(3).height = 32;
    const header = sheet.getRow(5);
    header.values = block.headers;
    header.height = 24;
    header.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2957A4" } };
      cell.alignment = { vertical: "middle" };
    });
    for (const values of block.rows) {
      const row = sheet.addRow(values);
      row.height = 22;
      row.eachCell((cell) => { cell.font = { name: "Arial", size: 11 }; });
      row.getCell(block.dateColumn).numFmt = "dd/mm/yyyy";
      row.getCell(block.headers.length).numFmt = "0";
    }
    block.headers.forEach((title, index) => {
      const lengths = block.rows.map((row) => {
        const value = row[index];
        return value instanceof Date ? 10 : String(value ?? "").length;
      });
      sheet.getColumn(index + 1).width = Math.min(60, Math.max(title.length + 3, ...lengths.map((n) => n + 3), 14));
    });
    sheet.getRow(2).font = { name: "Arial", size: 11 };
    sheet.getRow(3).font = { name: "Arial", size: 11 };
    sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: Math.max(5, sheet.rowCount), column: block.headers.length } };
    // Keep the first row and the column header visible, including the metadata above it.
    sheet.views = [{ state: "frozen", ySplit: 5 }];
  }
  return book;
}

export async function dashboardExcelBlob(data: DashboardExportData) {
  const book = await createDashboardWorkbook(data);
  const buffer = await book.xlsx.writeBuffer();
  return new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function dashboardCsvRows(data: DashboardExportData) {
  const records = new Map<string, (string | number)[]>();
  for (const a of data.alertas) records.set(`${a.tipo}:${a.recordId}`, [a.tipo, a.nome, "", a.situacao, formatDateBR(a.data), a.dias]);
  for (const e of data.estagios) {
    const key = `Estágio:${e.id}`;
    const previous = records.get(key);
    records.set(key, ["Estágio", e.nome, e.instituicao, previous?.[3] ?? "", formatDateBR(e.termino), e.dias]);
  }
  for (const f of data.ferias) {
    const key = `Férias:${f.id}`;
    if (!records.has(key)) records.set(key, ["Férias", f.nome, "", "", formatDateBR(f.inicio), f.dias]);
  }
  return [["Tipo", "Nome", "Instituição", "Situação", "Data", "Dias restantes"], ...records.values()];
}

export function dashboardCsvBlob(data: DashboardExportData) {
  const csv = dashboardCsvRows(data).map((row) => row.map((value) => {
    const text = String(value);
    // Prevent user-supplied text from being treated as a spreadsheet formula.
    const safe = typeof value === "string" && /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
  return new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
}