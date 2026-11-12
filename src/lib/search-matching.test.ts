import assert from 'node:assert/strict';
import { test } from 'node:test';
import { businessAddressFields, matchesSearch } from './search-matching';
import { businessAvailableStarts } from './business-availability';

test('service and location filters both apply with Persian and Arabic spelling', () => {
  const service = 'کوتاهی مو';
  const address = JSON.stringify({ address: 'خیابان آزادی', district: 'مرکز', point: { lat: 35, lng: 51 } });
  const locationFields = businessAddressFields(address, 'تهران');
  assert.equal(matchesSearch('كوتاهي', [service]) && matchesSearch('مركز', locationFields), true);
  assert.equal(matchesSearch('كوتاهي', [service]) && matchesSearch('شیراز', locationFields), false);
  assert.equal(matchesSearch('point', locationFields), false);
});

test('matching a service and location still requires an available slot on the selected day', () => {
  const date = '2026-11-14';
  const start = Date.parse(`${date}T09:00:00+03:30`);
  const criteriaMatch = matchesSearch('رنگ', ['رنگ مو']) && matchesSearch('تهران', ['تهران']);
  const input = {
    date, services: [{ id: 'color', durationMin: 60 }], memberKeys: ['owner'],
    shifts: [{ memberKey: 'owner', date, startTime: '09:00', endTime: '10:00' }],
    recurringShifts: [], assignments: [], now: start - 1,
  };
  assert.equal(criteriaMatch && businessAvailableStarts(input).length > 0, true);
  assert.equal(criteriaMatch && businessAvailableStarts({ ...input, busy: [{ memberKey: 'owner', start, end: start + 3_600_000 }] }).length > 0, false);
});
