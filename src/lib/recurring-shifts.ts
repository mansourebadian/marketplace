export type ShiftPeriod = { start: string; end: string };
export type RecurringShift = { memberKey: string; startDate: string; endDate: string | null; interval: number; days: string };

export function recurringPeriods(schedules: RecurringShift[], memberKey: string, date: string): ShiftPeriod[] {
  const schedule = schedules.filter(item => item.memberKey === memberKey && item.startDate <= date).sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  if (!schedule || (schedule.endDate && date > schedule.endDate)) return [];
  const target = new Date(`${date}T00:00:00Z`);
  const start = new Date(`${schedule.startDate}T00:00:00Z`);
  const startWeek = start.getTime() - ((start.getUTCDay() + 1) % 7) * 86400000;
  if (Math.floor((target.getTime() - startWeek) / 604800000) % schedule.interval !== 0) return [];
  try { const days = JSON.parse(schedule.days) as ShiftPeriod[][]; return days[target.getUTCDay()] || []; } catch { return []; }
}

export function periodMinutes(period: ShiftPeriod): number {
  const [h1, m1] = period.start.split(':').map(Number);
  const [h2, m2] = period.end.split(':').map(Number);
  return h2 * 60 + m2 - h1 * 60 - m1;
}
