import { parseLocalDate } from "./dates";
import type { Ferias } from "./mock-data";

export interface VacationSegment {
  vacation: Ferias;
  startColumn: number;
  endColumn: number;
  lane: number;
}

// Presentation only: split civil-date periods into weekly spans, never mutate records.
export function vacationWeeks(vacations: Ferias[], year: number, month: number) {
  const offset = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const count = Math.ceil((offset + days) / 7);
  return Array.from({ length: count }, (_, week) => {
    const firstDay = Math.max(1, week * 7 - offset + 1);
    const lastDay = Math.min(days, week * 7 - offset + 7);
    const first = new Date(year, month, firstDay);
    const last = new Date(year, month, lastDay);
    const segments = vacations.flatMap((vacation) => {
      const start = parseLocalDate(vacation.inicio);
      const end = parseLocalDate(vacation.termino);
      if (!start || !end || start > end || end < first || start > last) return [];
      const startDay = start < first ? firstDay : start.getDate();
      const endDay = end > last ? lastDay : end.getDate();
      return [{ vacation, startColumn: (offset + startDay - 1) % 7, endColumn: (offset + endDay - 1) % 7, lane: 0 }];
    }).sort((a, b) => a.startColumn - b.startColumn || b.endColumn - a.endColumn || a.vacation.id.localeCompare(b.vacation.id));
    const laneEnds: number[] = [];
    for (const segment of segments) {
      const freeLane = laneEnds.findIndex((end) => end < segment.startColumn);
      segment.lane = freeLane < 0 ? laneEnds.length : freeLane;
      laneEnds[segment.lane] = segment.endColumn;
    }
    return { segments, laneCount: laneEnds.length };
  });
}