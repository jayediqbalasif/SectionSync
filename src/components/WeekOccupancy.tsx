import { Course, parseTimeToMinutes } from '../types';
import { chosen } from '../lib/workspace';
import { calendarRange } from '../lib/calendar';

export function WeekOccupancy({ courses, selections }: { courses: Course[]; selections: Record<string, string> }) {
  const meetings = chosen(courses, selections).flatMap(({ section }) => section.timeSlots);
  const { days, start, end } = calendarRange(meetings);
  return <div className="week-occupancy" role="img" aria-label="Weekly occupancy preview, Monday to Sunday. Filled blocks show your selected class times; open space shows free time.">
    {days.map((day) => <div className="occupancy-day" key={day} aria-hidden="true">
      {meetings.filter((meeting) => meeting.day === day).map((meeting, index) => <i key={index} style={{ top: `${(parseTimeToMinutes(meeting.startTime) - start) / (end - start) * 100}%`, height: `${(parseTimeToMinutes(meeting.endTime) - parseTimeToMinutes(meeting.startTime)) / (end - start) * 100}%` }} />)}
    </div>)}
  </div>;
}
