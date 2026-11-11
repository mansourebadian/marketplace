import type { AvailabilityProfessional, AvailabilityService } from './availability';

export function assignBookingServices(services: (AvailabilityService & { memberKey: string })[], professionals: AvailabilityProfessional[], start: number) {
  let cursor = start;
  const assignments: { serviceId: string; memberKey: string; start: number; end: number }[] = [];
  for (const service of services) {
    const end = cursor + service.durationMin * 60_000;
    const person = professionals.find(candidate => (service.memberKey === '__any__' || candidate.id === service.memberKey)
      && candidate.serviceIds.includes(service.id)
      && candidate.working.some(period => period.start <= cursor && period.end >= end)
      && !candidate.busy.some(period => period.start < end && period.end > cursor));
    if (!person) return null;
    assignments.push({ serviceId: service.id, memberKey: person.id, start: cursor, end });
    cursor = end;
  }
  return assignments;
}
