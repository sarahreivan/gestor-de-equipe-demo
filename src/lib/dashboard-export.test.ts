import { describe, expect, it } from "vitest";
import { createDashboardWorkbook, dashboardCsvRows, excelDate, type DashboardExportData } from "./dashboard-export";

const data: DashboardExportData = {
  alertas: [{ recordId: "1", tipo: "Estágio", nome: "Beatriz Almeida Santos", situacao: "Vencendo", data: "2026-11-30", dias: 18 }],
  estagios: [{ id: "1", nome: "Beatriz Almeida Santos", instituicao: "Universidade", termino: "2026-11-30", dias: 18 }],
  ferias: [{ id: "2", nome: "Felipe Araújo Cardoso", inicio: "2026-12-01", dias: 19 }],
  filters: { periodo: "Últimos / próximos 90 dias", vinculo: "Estágio", status: "Ativo" },
};

describe("dashboard exports", () => {
  it("creates exactly the three requested worksheets with current filters", async () => {
    const book = await createDashboardWorkbook(data, new Date(2026, 10, 12));
    expect(book.worksheets.map((s) => s.name)).toEqual(["Alertas operacionais", "Estágios a vencer", "Próximas férias"]);
    for (const s of book.worksheets) {
      expect(s.getCell(3, 1).value).toContain("Período: Últimos / próximos 90 dias | Vínculo: Estágio | Status: Ativo");
      expect(s.views[0]).toMatchObject({ state: "frozen", ySplit: 5 });
      expect(s.autoFilter).toBeDefined();
    }
  });
  it("stores actual calendar dates and numeric days remaining", async () => {
    const book = await createDashboardWorkbook(data);
    const sheet = book.worksheets[0];
    expect(sheet.getCell("D6").value).toEqual(new Date(Date.UTC(2026, 10, 30)));
    expect(sheet.getCell("D6").numFmt).toBe("dd/mm/yyyy");
    expect(sheet.getCell("E6").value).toBe(18);
    expect(excelDate("2026-12-01")).toEqual(new Date(Date.UTC(2026, 11, 1)));
  });
  it("exports one CSV line per record, with a Type column and no separators", () => {
    const rows = dashboardCsvRows(data);
    expect(rows[0][0]).toBe("Tipo");
    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual(["Estágio", "Beatriz Almeida Santos", "Universidade", "Vencendo", "30/11/2026", 18]);
    expect(rows[2]).toEqual(["Férias", "Felipe Araújo Cardoso", "", "", "01/12/2026", 19]);
  });
});