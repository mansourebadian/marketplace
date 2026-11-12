import assert from 'node:assert/strict';
import { test } from 'node:test';
import { customerCountLabel } from './customer-count-label';

test('uses accurate ranges at each customer-count boundary', () => {
  const cases: [number, string | null][] = [
    [0, 'ده‌ها نفر'], [1, 'ده‌ها نفر'], [9, 'ده‌ها نفر'], [10, 'ده‌ها نفر'], [99, 'ده‌ها نفر'],
    [100, 'صدها نفر'], [999, 'صدها نفر'], [1_000, 'هزاران نفر'],
    [10_000, 'ده‌ها هزار نفر'], [100_000, 'صدها هزار نفر'],
    [1_000_000, 'میلیون‌ها نفر'], [10_000_000, 'ده‌ها میلیون نفر'],
    [100_000_000, 'صدها میلیون نفر'], [1_000_000_000, 'میلیارد‌ها نفر'],
  ];
  for (const [count, expected] of cases) assert.equal(customerCountLabel(count), expected);
});
