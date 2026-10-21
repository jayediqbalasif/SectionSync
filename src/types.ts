/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DayOfWeek =
  'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export interface TimeSlot {
  day: DayOfWeek;
  startTime: string; // "HH:MM" (24-hour, e.g., "09:30")
  endTime: string; // "HH:MM" (24-hour, e.g., "11:00")
  room?: string;
}

export interface Section {
  id: string;
  name: string; // e.g., "Sec 01" or "A"
  faculty: string; // e.g., "Dr. John Doe"
  timeSlots: TimeSlot[];
  preferenceOrder: number; // 1 = Highest, 2 = Second, etc.
  facultyInitial?: string;
  catalogOfferingId?: string;
  sourceSerial?: number;
  sourcePage?: number;
  status?: 'offered' | 'if-required' | 'tba' | 'customized';
  note?: string;
}

export interface Course {
  credits?: number;
  kind?: 'theory' | 'lab';
  id: string;
  code: string; // e.g., "CSE 101"
  title: string; // e.g., "Introduction to Computer Science"
  color: string; // Hex or Tailwind color class (e.g., "emerald")
  sections: Section[];
  catalogId?: string;
  program?: string;
}

/**
 * Parses "HH:MM" 24h format into minutes from midnight for easy comparison
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Format minutes from midnight to 12-hour AM/PM string (e.g., 570 -> "09:30 AM")
 */
export function formatMinutesTo12h(minutesTotal: number): string {
  const hours24 = Math.floor(minutesTotal / 60) % 24;
  const mins = minutesTotal % 60;
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minsStr = mins.toString().padStart(2, '0');
  return `${hours12.toString().padStart(2, '0')}:${minsStr} ${ampm}`;
}

/**
 * Format "HH:MM" 24h string to "HH:MM AM/PM"
 */
export function formatTimeTo12h(timeStr: string): string {
  if (!timeStr) return '';
  return formatMinutesTo12h(parseTimeToMinutes(timeStr));
}

/**
 * Checks if two individual time slots overlap on the same day
 */
export function timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) return false;

  const start1 = parseTimeToMinutes(slot1.startTime);
  const end1 = parseTimeToMinutes(slot1.endTime);
  const start2 = parseTimeToMinutes(slot2.startTime);
  const end2 = parseTimeToMinutes(slot2.endTime);

  // Overlap occurs when start1 < end2 AND start2 < end1
  return start1 < end2 && start2 < end1;
}

/**
 * Checks if two sections have any overlapping time slots
 */
export function sectionsConflict(sec1: Section, sec2: Section): boolean {
  for (const slot1 of sec1.timeSlots) {
    for (const slot2 of sec2.timeSlots) {
      if (timeSlotsOverlap(slot1, slot2)) {
        return true;
      }
    }
  }
  return false;
}

export interface SavedPlan {
  id: string;
  name: string;
  savedAt: string; // ISO string
  courses: Course[];
  selectedSections: Record<string, string>;
  note?: string;
}
