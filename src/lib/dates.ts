// Database DATE values are civil dates, not UTC instants.
const DAY_MS = 86_400_000;

export function parseLocalDate(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function formatLocalDateISO(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDateBR(value?: string | null): string {
  const date = parseLocalDate(value);
  if (!date) return "—";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getFullYear()).padStart(4, "0")}`;
}

// UTC is used only as a day index from already-local calendar parts. This
// avoids 23/25-hour days changing counts across daylight-saving transitions.
function calendarDay(date: Date): number {
  const index = new Date(0);
  index.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  index.setUTCHours(0, 0, 0, 0);
  return index.getTime() / DAY_MS;
}

export function daysRemaining(value: string, today: Date = new Date()): number {
  const date = parseLocalDate(value);
  return date ? calendarDay(date) - calendarDay(today) : Number.NaN;
}

export function inclusiveDaysBetween(start: string, end: string): number {
  const first = parseLocalDate(start);
  const last = parseLocalDate(end);
  return first && last ? Math.max(0, calendarDay(last) - calendarDay(first) + 1) : 0;
}