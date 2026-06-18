const pad = (value: number): string => String(value).padStart(2, "0");

export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function formatDisplayDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}がつ ${Number(day)}にち`;
}

export function addDays(date: string, days: number): string {
  const base = new Date(`${date}T00:00:00`);
  base.setDate(base.getDate() + days);
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
}

export function getRecentDates(count: number): string[] {
  const today = getTodayKey();
  return Array.from({ length: count }, (_, index) => addDays(today, -index));
}
