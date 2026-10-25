import { TimeSlot, formatTimeTo12h } from '../types';

export function meetingDisplay(meetings: TimeSlot[], includeRoom = false) {
  const groups = new Map<string, { days: string[]; time: string; room?: string }>();
  for (const meeting of meetings) {
    const key = `${meeting.startTime}-${meeting.endTime}${includeRoom ? `-${meeting.room || ''}` : ''}`;
    const group = groups.get(key) || {
      days: [],
      ...(includeRoom ? { room: meeting.room || '' } : {}),
      time: `${formatTimeTo12h(meeting.startTime).replace(/^0/, '')}–${formatTimeTo12h(meeting.endTime).replace(/^0/, '')}`,
    };
    group.days.push(meeting.day.slice(0, 3));
    groups.set(key, group);
  }
  return [...groups.values()].map(({ days, time, ...rest }) => ({ days: days.join(includeRoom ? ' · ' : '–'), time, ...rest }));
}
