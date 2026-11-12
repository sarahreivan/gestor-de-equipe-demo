import { describe, expect, it } from "vitest";
import { daysRemaining, formatDateBR, formatLocalDateISO, inclusiveDaysBetween, parseLocalDate } from "./dates";

describe("database civil dates", () => {
  it.each([
    ["2025-12-01", "01/12/2025"],
    ["2026-11-30", "30/11/2026"],
    ["2026-06-01", "01/06/2026"],
    ["2026-03-02", "02/03/2026"],
    ["2026-01-12", "12/01/2026"],
    ["2027-01-11", "11/01/2027"],
  ])("preserves %s in Brazilian display and date-input round trips", (iso, expected) => {
    expect(formatDateBR(iso)).toBe(expected);
    const date = parseLocalDate(iso);
    expect(date).not.toBeNull();
    if (!date) throw new Error("Expected a valid civil date");
    expect(formatLocalDateISO(date)).toBe(iso);
  });

  it("counts calendar days independently of time of day", () => {
    for (const hour of [0, 12, 23]) {
      const today = new Date(2026, 10, 10, hour, 59);
      expect(daysRemaining("2026-11-10", today)).toBe(0);
      expect(daysRemaining("2026-11-09", today)).toBe(-1);
      expect(daysRemaining("2026-11-11", today)).toBe(1);
      expect(daysRemaining("2026-11-30", today)).toBe(20);
    }
  });

  it("includes today and day 30, excludes past dates and day 31 from the 30-day window", () => {
    const today = new Date(2026, 10, 10, 23, 59);
    const inWindow = (iso: string) => {
      const days = daysRemaining(iso, today);
      return days >= 0 && days <= 30;
    };
    expect(inWindow("2026-11-09")).toBe(false);
    expect(inWindow("2026-11-10")).toBe(true);
    expect(daysRemaining("2026-12-10", today)).toBe(30);
    expect(inWindow("2026-12-10")).toBe(true);
    expect(inWindow("2026-12-11")).toBe(false);
    expect(inWindow("")).toBe(false);
  });

  it("counts vacation days inclusively across month, year, leap-year and DST boundaries", () => {
    expect(inclusiveDaysBetween("2026-11-10", "2026-11-10")).toBe(1);
    expect(inclusiveDaysBetween("2026-11-30", "2026-12-01")).toBe(2);
    expect(inclusiveDaysBetween("2026-12-31", "2027-01-01")).toBe(2);
    expect(inclusiveDaysBetween("2024-02-28", "2024-03-01")).toBe(3);
    expect(inclusiveDaysBetween("2018-11-03", "2018-11-05")).toBe(3);
    expect(daysRemaining("2018-11-05", new Date(2018, 10, 3, 23))).toBe(2);
    expect(inclusiveDaysBetween("2026-11-11", "2026-11-10")).toBe(0);
  });

  it.each(["", "2026-02-30", "2026-13-01", "not-a-date", "2026-11-10T00:00:00Z"])("rejects invalid date-only value %s", (value) => {
    expect(parseLocalDate(value)).toBeNull();
    expect(formatDateBR(value)).toBe("—");
    expect(inclusiveDaysBetween(value, "2026-11-10")).toBe(0);
  });
});