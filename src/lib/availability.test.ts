import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findAvailableStarts, type AvailabilityProfessional } from './availability';

const minute = 60_000;
const at = (minutes: number) => minutes * minute;
const specialist: AvailabilityProfessional = {
  id: 'a', serviceIds: ['hair'], working: [{ start: at(600), end: at(720) }],
  busy: [{ start: at(630), end: at(660) }],
};

test('only returns qualified, working and non-overlapping future slots', () => {
  const slots = findAvailableStarts({ services: [{ id: 'hair', durationMin: 30 }], professionals: [specialist], start: at(600), end: at(720), now: at(599) });
  assert.deepEqual(slots, [at(600), at(660), at(690)]);
  assert.deepEqual(findAvailableStarts({ services: [{ id: 'nails', durationMin: 30 }], professionals: [specialist], start: at(600), end: at(720), now: at(0) }), []);
});

test('accounts for all selected services and allows qualified specialists in sequence', () => {
  const second: AvailabilityProfessional = { id: 'b', serviceIds: ['nails'], working: [{ start: at(600), end: at(720) }], busy: [] };
  const slots = findAvailableStarts({ services: [{ id: 'hair', durationMin: 30 }, { id: 'nails', durationMin: 30 }], professionals: [specialist, second], start: at(600), end: at(720), now: at(599) });
  assert.deepEqual(slots, [at(600), at(660)]);
  assert.deepEqual(findAvailableStarts({ services: [{ id: 'hair', durationMin: 0 }], professionals: [specialist], start: at(600), end: at(720), now: 0 }), []);
});
