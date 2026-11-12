import { expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { colaboradorToRow, estagioToRow, feriasToRow, processoToRow, sugerirDataRenovacao } from "./db";

it("sends the chosen admission date unchanged", () => {
  expect(colaboradorToRow({ nome: "Beatriz", cpf: "", vinculo: "Estágio", status: "Ativo", admissao: "2025-12-01" }).data_admissao).toBe("2025-12-01");
});

it("sends chosen internship start, end and renewal dates unchanged", () => {
  const row = estagioToRow({ tipo: "Público", inicio: "2026-01-12", termino: "2027-01-11", dataRenovacao: "2026-12-11", status: "Vigente" });
  expect(row.data_inicio).toBe("2026-01-12");
  expect(row.data_fim).toBe("2027-01-11");
  expect(row.data_renovacao).toBe("2026-12-11");
});

it("sends chosen vacation and SIAPE dates unchanged", () => {
  const row = feriasToRow({ colaboradorId: "id", inicio: "2026-06-01", termino: "2026-06-30", dataSiape: "2026-05-01", dias: 30, status: "Planejada" });
  expect(row.data_inicio).toBe("2026-06-01");
  expect(row.data_fim).toBe("2026-06-30");
  expect(row.data_SIAPE).toBe("2026-05-01");
});

it("sends chosen administrative process dates unchanged", () => {
  expect(processoToRow({ colaboradorId: "id", tipo: "Renovação", data: "2026-03-02" }).data_solicitacao).toBe("2026-03-02");
});

it("keeps renewal suggestions on local calendar days with month-end clamping", () => {
  expect(sugerirDataRenovacao("2026-11-30")).toBe("2026-10-30");
  expect(sugerirDataRenovacao("2027-01-11")).toBe("2026-12-11");
  expect(sugerirDataRenovacao("2026-03-31")).toBe("2026-02-28");
  expect(sugerirDataRenovacao("2024-03-31")).toBe("2024-02-29");
});