import { DayOfWeek } from '../types';

export const TIME_PRESETS = {
  theory: [
    { name: 'Slot 1', startTime: '08:30', endTime: '09:50' },
    { name: 'Slot 2', startTime: '09:51', endTime: '11:10' },
    { name: 'Slot 3', startTime: '11:11', endTime: '12:30' },
    { name: 'Slot 4', startTime: '12:31', endTime: '13:50' },
    { name: 'Slot 5', startTime: '13:51', endTime: '15:10' },
    { name: 'Slot 6', startTime: '15:11', endTime: '16:30' },
  ],
  lab: [
    { name: 'Morning lab', startTime: '08:30', endTime: '11:00' },
    { name: 'Midday lab', startTime: '11:11', endTime: '13:40' },
    { name: 'Afternoon lab', startTime: '14:00', endTime: '16:30' },
  ],
};

export const DAY_GROUPS: { name: string; days: DayOfWeek[] }[] = [
  { name: 'Sat / Tue', days: ['Saturday', 'Tuesday'] },
  { name: 'Sun / Wed', days: ['Sunday', 'Wednesday'] },
];
