/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Course } from './types';

export const SAMPLE_COURSES: Course[] = [
  {
    id: 'course-cse-101',
    code: 'CSE 101',
    title: 'Intro to Programming',
    color: 'indigo', // Tailwind color name
    sections: [
      {
        id: 'sec-cse-1-a',
        name: 'Sec A (Dr. Alice Vance)',
        faculty: 'Dr. Alice Vance',
        preferenceOrder: 1,
        timeSlots: [
          { day: 'Monday', startTime: '09:00', endTime: '10:30' },
          { day: 'Wednesday', startTime: '09:00', endTime: '10:30' },
        ],
      },
      {
        id: 'sec-cse-1-b',
        name: 'Sec B (Prof. Bob Miller)',
        faculty: 'Prof. Bob Miller',
        preferenceOrder: 2,
        timeSlots: [
          { day: 'Tuesday', startTime: '11:00', endTime: '12:30' },
          { day: 'Thursday', startTime: '11:00', endTime: '12:30' },
        ],
      },
      {
        id: 'sec-cse-1-c',
        name: 'Sec C (Dr. Charlie Brown)',
        faculty: 'Dr. Charlie Brown',
        preferenceOrder: 3,
        timeSlots: [
          { day: 'Monday', startTime: '14:00', endTime: '15:30' },
          { day: 'Wednesday', startTime: '14:00', endTime: '15:30' },
        ],
      },
    ],
  },
  {
    id: 'course-mat-112',
    code: 'MAT 112',
    title: 'Calculus I',
    color: 'blue',
    sections: [
      {
        id: 'sec-mat-1',
        name: 'Sec 01 (Dr. David Davis)',
        faculty: 'Dr. David Davis',
        preferenceOrder: 1,
        timeSlots: [
          { day: 'Tuesday', startTime: '09:30', endTime: '11:00' },
          { day: 'Thursday', startTime: '09:30', endTime: '11:00' },
        ],
      },
      {
        id: 'sec-mat-2',
        name: 'Sec 02 (Dr. Edward Elric)',
        faculty: 'Dr. Edward Elric',
        preferenceOrder: 2,
        timeSlots: [
          { day: 'Monday', startTime: '10:30', endTime: '12:00' },
          { day: 'Wednesday', startTime: '10:30', endTime: '12:00' },
        ],
      },
      {
        id: 'sec-mat-3',
        name: 'Sec 03 (Prof. Flora Macdonald)',
        faculty: 'Prof. Flora Macdonald',
        preferenceOrder: 3,
        timeSlots: [{ day: 'Friday', startTime: '09:00', endTime: '12:00' }],
      },
    ],
  },
  {
    id: 'course-phy-103',
    code: 'PHY 103',
    title: 'Physics I with Lab',
    color: 'emerald',
    sections: [
      {
        id: 'sec-phy-1',
        name: 'Sec L1 (Dr. Gary Green)',
        faculty: 'Dr. Gary Green',
        preferenceOrder: 1,
        timeSlots: [
          { day: 'Monday', startTime: '09:00', endTime: '10:30' }, // Overlaps with CSE 101 Sec A
          { day: 'Friday', startTime: '13:00', endTime: '15:00' }, // Lab
        ],
      },
      {
        id: 'sec-phy-2',
        name: 'Sec L2 (Dr. Gary Green)',
        faculty: 'Dr. Gary Green',
        preferenceOrder: 2,
        timeSlots: [
          { day: 'Tuesday', startTime: '14:00', endTime: '15:30' },
          { day: 'Friday', startTime: '13:00', endTime: '15:00' }, // Lab
        ],
      },
    ],
  },
  {
    id: 'course-eng-105',
    code: 'ENG 105',
    title: 'English Composition',
    color: 'amber',
    sections: [
      {
        id: 'sec-eng-1',
        name: 'Sec S01 (Prof. Helen Hunt)',
        faculty: 'Prof. Helen Hunt',
        preferenceOrder: 1,
        timeSlots: [
          { day: 'Monday', startTime: '12:00', endTime: '13:30' },
          { day: 'Wednesday', startTime: '12:00', endTime: '13:30' },
        ],
      },
      {
        id: 'sec-eng-2',
        name: 'Sec S02 (Prof. Helen Hunt)',
        faculty: 'Prof. Helen Hunt',
        preferenceOrder: 2,
        timeSlots: [
          { day: 'Tuesday', startTime: '11:00', endTime: '12:30' }, // Overlaps with CSE 101 Sec B
          { day: 'Thursday', startTime: '11:00', endTime: '12:30' }, // Overlaps with CSE 101 Sec B
        ],
      },
    ],
  },
  {
    id: 'course-bio-101',
    code: 'BIO 101',
    title: 'General Biology',
    color: 'rose',
    sections: [
      {
        id: 'sec-bio-1',
        name: 'Sec 1 (Dr. Irene Adler)',
        faculty: 'Dr. Irene Adler',
        preferenceOrder: 1,
        timeSlots: [
          { day: 'Tuesday', startTime: '09:30', endTime: '11:00' }, // Overlaps with MAT 112 Sec 01
          { day: 'Thursday', startTime: '09:30', endTime: '11:00' }, // Overlaps with MAT 112 Sec 01
        ],
      },
      {
        id: 'sec-bio-2',
        name: 'Sec 2 (Dr. Irene Adler)',
        faculty: 'Dr. Irene Adler',
        preferenceOrder: 2,
        timeSlots: [
          { day: 'Monday', startTime: '15:30', endTime: '17:00' },
          { day: 'Wednesday', startTime: '15:30', endTime: '17:00' },
        ],
      },
    ],
  },
];
