import test from 'node:test';
import assert from 'node:assert/strict';
import { meetingDisplay } from '../src/lib/meetingDisplay.ts';

test('tile meetings combine matching times without losing different schedules', () => {
  assert.deepEqual(meetingDisplay([
    { day: 'Monday', startTime: '10:30', endTime: '12:00' },
    { day: 'Wednesday', startTime: '10:30', endTime: '12:00' },
    { day: 'Friday', startTime: '14:00', endTime: '16:30' },
  ]), [
    { days: 'Mon–Wed', time: '10:30 AM–12:00 PM' },
    { days: 'Fri', time: '2:00 PM–4:30 PM' },
  ]);
  assert.deepEqual(meetingDisplay([]), []);
});

test('sidebar combines only meetings with the same time and room', () => {
  const meetings = [
    { day: 'Saturday' as const, startTime: '12:31', endTime: '13:50', room: '304' },
    { day: 'Tuesday' as const, startTime: '12:31', endTime: '13:50', room: '304' },
    { day: 'Wednesday' as const, startTime: '12:31', endTime: '13:50', room: '426' },
  ];
  assert.deepEqual(meetingDisplay(meetings, true), [
    { days: 'Sat · Tue', time: '12:31 PM–1:50 PM', room: '304' },
    { days: 'Wed', time: '12:31 PM–1:50 PM', room: '426' },
  ]);
  assert.equal(meetingDisplay([{ day: 'Monday', startTime: '09:00', endTime: '10:00' }], true)[0].room, '');
});
