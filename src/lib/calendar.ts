import { TimeSlot, parseTimeToMinutes, DAYS_OF_WEEK } from '../types';

export function calendarRange(meetings: TimeSlot[]) {
  return {
    days: DAYS_OF_WEEK,
    start: Math.min(8, ...meetings.map((m) => Math.floor(parseTimeToMinutes(m.startTime) / 60))) * 60,
    end: Math.max(18, ...meetings.map((m) => Math.ceil(parseTimeToMinutes(m.endTime) / 60))) * 60,
  };
}
