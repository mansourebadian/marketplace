export type AvailabilityInterval = { start: number; end: number };
export type AvailabilityService = { id: string; durationMin: number };
export type AvailabilityProfessional = {
  id: string;
  serviceIds: string[];
  working: AvailabilityInterval[];
  busy: AvailabilityInterval[];
};

/** All times are absolute Unix timestamps in milliseconds. Intervals are [start, end). */
export function findAvailableStarts({
  services, professionals, start, end, now, intervalMin = 30,
}: {
  services: AvailabilityService[];
  professionals: AvailabilityProfessional[];
  start: number;
  end: number;
  now: number;
  intervalMin?: number;
}): number[] {
  if (!services.length || !Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(now)
    || !Number.isInteger(intervalMin) || intervalMin <= 0 || end <= start
    || services.some((service) => !Number.isInteger(service.durationMin) || service.durationMin <= 0)) return [];

  // Each service starts as soon as the previous one ends. A different qualified
  // professional can perform each service, but none can overlap an existing booking.
  function canPerform(service: AvailabilityService, from: number, to: number) {
    return professionals.some((person) => person.serviceIds.includes(service.id)
      && person.working.some((period) => period.start <= from && period.end >= to)
      && !person.busy.some((period) => period.start < to && period.end > from));
  }

  const step = intervalMin * 60_000;
  const total = services.reduce((sum, service) => sum + service.durationMin * 60_000, 0);
  const slots: number[] = [];
  for (let slot = start; slot + total <= end; slot += step) {
    if (slot <= now) continue;
    let cursor = slot;
    const available = services.every((service) => {
      const next = cursor + service.durationMin * 60_000;
      const valid = canPerform(service, cursor, next);
      cursor = next;
      return valid;
    });
    if (available) slots.push(slot);
  }
  return slots;
}
