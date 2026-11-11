import { findAvailableStarts, type AvailabilityProfessional, type AvailabilityService } from './availability';
import { recurringPeriods, type RecurringShift, type ShiftPeriod } from './recurring-shifts';

type Shift = { memberKey: string; date: string; startTime: string | null; endTime: string | null };
type Assignment = { memberKey: string; serviceIds: string };
type BusyPeriod = { memberKey: string; start: number; end: number };

// Shift times are entered as local Iran time. Since 2022 Iran uses UTC+03:30 year-round.
function tehranTime(date: string, time: string): number {
  return Date.parse(`${date}T${time}:00+03:30`);
}

export function businessProfessionals({ date, services, memberKeys, shifts, recurringShifts, assignments, busy = [] }: {
  date: string; services: AvailabilityService[]; memberKeys: string[]; shifts: Shift[];
  recurringShifts: RecurringShift[]; assignments: Assignment[]; now: number; busy?: BusyPeriod[];
}): AvailabilityProfessional[] {
  const allIds = services.map(service => service.id);
  const professionals: AvailabilityProfessional[] = memberKeys.map(id => {
    const shift = shifts.find(item => item.memberKey === id && item.date === date);
    const periods: ShiftPeriod[] = shift ? shift.startTime && shift.endTime ? [{ start: shift.startTime, end: shift.endTime }] : [] : recurringPeriods(recurringShifts, id, date);
    const assignment = assignments.find(item => item.memberKey === id);
    let serviceIds = allIds;
    if (assignment) { try { const parsed: unknown = JSON.parse(assignment.serviceIds); serviceIds = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []; } catch { serviceIds = []; } }
    return { id, serviceIds, working: periods.map(period => ({ start: tehranTime(date, period.start), end: tehranTime(date, period.end) })), busy: busy.filter(period => period.memberKey === id).map(period => ({ start: period.start, end: period.end })) };
  });
  return professionals;
}

export function businessAvailableStarts(input: Parameters<typeof businessProfessionals>[0]): number[] {
  const professionals = businessProfessionals(input);
  const start = tehranTime(input.date, '00:00');
  return findAvailableStarts({ services: input.services, professionals, start, end: start + 24 * 60 * 60_000, now: input.now });
}
