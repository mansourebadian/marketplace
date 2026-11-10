import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { recurringPeriods, type RecurringShift } from './recurring-shifts';

const days = JSON.stringify([[{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }], [], [], [], [], [], []]);
const schedule: RecurringShift = { memberKey: 'owner', startDate: '2026-11-10', endDate: '2026-11-30', interval: 2, days };

test('recurring shifts respect start, end, alternating weeks, and multiple periods', () => {
  assert.deepEqual(recurringPeriods([schedule], 'owner', '2026-11-08'), []);
  assert.deepEqual(recurringPeriods([schedule], 'owner', '2026-11-15'), []);
  assert.equal(recurringPeriods([schedule], 'owner', '2026-11-22').length, 2);
  assert.deepEqual(recurringPeriods([schedule], 'owner', '2026-11-29'), []);
  assert.deepEqual(recurringPeriods([schedule], 'owner', '2026-12-06'), []);
  assert.deepEqual(recurringPeriods([schedule], 'other', '2026-11-22'), []);
});

test('a newer schedule supersedes an older schedule after it starts', () => {
  const newer = { ...schedule, startDate: '2026-11-20', endDate: '2026-11-21', interval: 1 };
  assert.deepEqual(recurringPeriods([schedule, newer], 'owner', '2026-11-22'), []);
});
