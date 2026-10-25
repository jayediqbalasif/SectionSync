import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarRange } from '../src/lib/calendar';
test('empty and occupied calendars always retain Sunday and every other day', () => {
  assert.equal(calendarRange([]).days.length, 7);
  assert.equal(calendarRange([]).days.at(-1), 'Sunday');
  assert.deepEqual(calendarRange([{ day: 'Monday', startTime: '07:30', endTime: '19:10' }]), { days: calendarRange([]).days, start: 420, end: 1200 });
});
