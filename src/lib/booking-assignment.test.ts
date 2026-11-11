import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assignBookingServices } from './booking-assignment';

const minute = 60_000;
const people = [
  { id: 'one', serviceIds: ['hair'], working: [{ start: 0, end: 120 * minute }], busy: [{ start: 30 * minute, end: 60 * minute }] },
  { id: 'two', serviceIds: ['hair', 'nails'], working: [{ start: 0, end: 120 * minute }], busy: [] },
];

test('any specialist selects an available and qualified person for each sequential service', () => {
  assert.deepEqual(assignBookingServices([{ id: 'hair', durationMin: 30, memberKey: '__any__' }, { id: 'nails', durationMin: 30, memberKey: '__any__' }], people, 30 * minute), [
    { serviceId: 'hair', memberKey: 'two', start: 30 * minute, end: 60 * minute },
    { serviceId: 'nails', memberKey: 'two', start: 60 * minute, end: 90 * minute },
  ]);
});

test('explicit choice fails when busy, unqualified or outside a shift', () => {
  assert.equal(assignBookingServices([{ id: 'hair', durationMin: 30, memberKey: 'one' }], people, 30 * minute), null);
  assert.equal(assignBookingServices([{ id: 'nails', durationMin: 30, memberKey: 'one' }], people, 0), null);
  assert.equal(assignBookingServices([{ id: 'hair', durationMin: 30, memberKey: 'two' }], people, 110 * minute), null);
});
