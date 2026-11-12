import { describe, expect, it } from "vitest";
import { vacationWeeks } from "./ferias-calendar";
import type { Ferias } from "./mock-data";

const period = (id: string, inicio: string, termino: string): Ferias => ({
  id, inicio, termino, colaboradorId: id, dias: 20, status: "Planejada", periodoGozo: "2026",
});

describe("weekly vacation presentation", () => {
  it("renders one span per week with inclusive local-date boundaries", () => {
    const record = period("a", "2026-11-05", "2026-11-17");
    const weeks = vacationWeeks([record], 2026, 10);
    expect(weeks.map((week) => week.segments.map(({ startColumn, endColumn }) => [startColumn, endColumn])))
      .toEqual([[[4, 6]], [[0, 6]], [[0, 2]], [], []]);
    expect(record.inicio).toBe("2026-11-05");
    expect(record.termino).toBe("2026-11-17");
  });

  it("stacks every overlapping period without hiding any, reusing nonoverlapping lanes", () => {
    const weeks = vacationWeeks([
      period("a", "2026-11-01", "2026-11-04"),
      period("b", "2026-11-03", "2026-11-05"),
      period("c", "2026-11-03", "2026-11-06"),
      period("d", "2026-11-05", "2026-11-07"),
    ], 2026, 10);
    expect(weeks[0].laneCount).toBe(3);
    expect(weeks[0].segments.find((s) => s.vacation.id === "d")?.lane).toBe(0);
    for (const week of weeks) {
      for (const a of week.segments) {
        for (const b of week.segments) {
          if (a === b || a.lane !== b.lane) continue;
          expect(a.endColumn < b.startColumn || b.endColumn < a.startColumn).toBe(true);
        }
      }
    }
  });

  it("clips month boundaries and preserves a one-day vacation", () => {
    const weeks = vacationWeeks([
      period("a", "2026-10-30", "2026-11-02"),
      period("b", "2026-11-30", "2026-12-04"),
      period("c", "2026-11-10", "2026-11-10"),
    ], 2026, 10);
    expect(weeks[0].segments[0].endColumn).toBe(1);
    expect(weeks[4].segments[0].startColumn).toBe(1);
    expect(weeks[4].segments[0].endColumn).toBe(1);
    expect(weeks[1].segments[0].startColumn).toBe(2);
    expect(weeks[1].segments[0].endColumn).toBe(2);
  });

  it("uses shorter empty weeks and handles leap years and year crossings", () => {
    expect(vacationWeeks([], 2026, 10).every((week) => week.laneCount === 0)).toBe(true);
    expect(vacationWeeks([period("a", "2024-02-29", "2024-03-01")], 2024, 1)[4].segments[0].startColumn).toBe(4);
    expect(vacationWeeks([period("a", "2026-12-31", "2027-01-02")], 2027, 0)[0].segments[0].endColumn).toBe(6);
  });
});