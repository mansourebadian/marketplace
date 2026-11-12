import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesReservationFilter } from './reservation-filters';

const now = Date.parse('2026-11-12T12:00:00Z');
const reservation = (status: string, start: string) => ({ status, items: [{ startsAt: start }] });

test('status filters separate confirmed, cancelled and test reservations', () => {
  const future = reservation('CONFIRMED', '2026-11-13T12:00:00Z');
  const past = reservation('CONFIRMED', '2026-11-11T12:00:00Z');
  const cancelled = reservation('CANCELLED', '2026-11-13T12:00:00Z');
  const simulated = reservation('TEST_CONFIRMED', '2026-11-13T12:00:00Z');
  assert.equal(matchesReservationFilter(future, 'upcoming', '', now), true);
  assert.equal(matchesReservationFilter(past, 'past', '', now), true);
  assert.equal(matchesReservationFilter(cancelled, 'cancelled', '', now), true);
  assert.equal(matchesReservationFilter(simulated, 'test', '', now), true);
  assert.equal(matchesReservationFilter(cancelled, 'upcoming', '', now), false);
  assert.equal(matchesReservationFilter(simulated, 'upcoming', '', now), false);
  assert.equal(matchesReservationFilter(reservation('NO_SHOW', '2026-11-11T12:00:00Z'), 'past', '', now), true);
  assert.equal(matchesReservationFilter(reservation('CONFIRMED', '2026-11-12T12:00:00Z'), 'past', '', now), true);
});

test('date filtering uses the Tehran calendar day and combines with status', () => {
  const appointment = reservation('CONFIRMED', '2026-11-12T21:00:00Z');
  assert.equal(matchesReservationFilter(appointment, 'upcoming', '2026-11-13', now), true);
  assert.equal(matchesReservationFilter(appointment, 'upcoming', '2026-11-12', now), false);
  assert.equal(matchesReservationFilter(appointment, 'cancelled', '2026-11-13', now), false);
  assert.equal(matchesReservationFilter({ status: 'CONFIRMED', items: [] }, 'all', '2026-11-13', now), false);
});
