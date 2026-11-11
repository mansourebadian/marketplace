import assert from 'node:assert/strict';
import { test } from 'node:test';
import { businessAvailableStarts } from './business-availability';

const date = '2026-11-14';
const time = (hour: string) => Date.parse(`${date}T${hour}:00+03:30`);
const days = JSON.stringify([[ ], [ ], [ ], [ ], [ ], [ ], [{ start: '09:00', end: '11:00' }]]);
const recurring = [{ memberKey: 'owner', startDate: '2026-11-10', endDate: null, interval: 1, days }];
const base = { date, services: [{ id: 'hair', durationMin: 60 }], memberKeys: ['owner'], shifts: [], recurringShifts: recurring, assignments: [], now: time('08:00') };

test('recurring shifts produce slots only while the service fits', () => {
  assert.deepEqual(businessAvailableStarts(base), [time('09:00'), time('09:30'), time('10:00')]);
  assert.deepEqual(businessAvailableStarts({ ...base, now: time('09:00') }), [time('09:30'), time('10:00')]);
});

test('explicit days off and service assignments override recurring availability', () => {
  assert.deepEqual(businessAvailableStarts({ ...base, shifts: [{ memberKey: 'owner', date, startTime: null, endTime: null }] }), []);
  assert.deepEqual(businessAvailableStarts({ ...base, assignments: [{ memberKey: 'owner', serviceIds: '[]' }] }), []);
  assert.deepEqual(businessAvailableStarts({ ...base, shifts: [{ memberKey: 'owner', date, startTime: '12:00', endTime: '13:00' }] }), [time('12:00')]);
});

test('existing reservations exclude only overlapping times for the assigned specialist', () => {
  const busy = [{ memberKey: 'owner', start: time('09:30'), end: time('10:00') }];
  assert.deepEqual(businessAvailableStarts({ ...base, busy }), [time('10:00')]);
  assert.deepEqual(businessAvailableStarts({ ...base, busy: [{ ...busy[0], memberKey: 'other' }] }), [time('09:00'), time('09:30'), time('10:00')]);
});
