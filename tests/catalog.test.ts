import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadCatalog,
  findCatalogCourse,
  offeringsForCourse,
  suggestCatalogCourses,
} from '../src/lib/catalog.ts';
import { validateCourses } from '../src/lib/workspace.ts';
const COURSE_CATALOG = await loadCatalog();

test('Fall 2026 BSCSE catalog contains every extracted offering', () => {
  assert.equal(COURSE_CATALOG.id, 'fall-2026-bscse');
  assert.equal(COURSE_CATALOG.courses.length, 73);
  assert.equal(
    COURSE_CATALOG.courses.reduce((total, course) => total + course.sections.length, 0),
    723,
  );
  assert.deepEqual(
    COURSE_CATALOG.courses
      .flatMap((course) => course.sections.map((section) => section.sourceSerial))
      .sort((a, b) => a - b),
    Array.from({ length: 723 }, (_, index) => index + 1),
  );
});

test('catalog lookup returns verified course metadata and faculty schedules', () => {
  const course = findCatalogCourse(' cse   2217 ');
  assert.equal(findCatalogCourse('CSE2217')?.code, 'CSE 2217');
  assert.equal(suggestCatalogCourses('cse2217')[0]?.code, 'CSE 2217');
  assert.ok(course);
  assert.equal(course.title, 'Data Structure and Algorithms II');
  assert.equal(course.credits, 3);
  assert.equal(course.kind, 'theory');
  assert.equal(course.sections.length, 12);
  const sectionC = course.sections.find((section) => section.name === 'C');
  assert.ok(sectionC);
  assert.equal(sectionC.faculty, 'Ms. Mehreen Hossain Chowdhury');
  assert.deepEqual(sectionC.timeSlots, [
    { day: 'Saturday', startTime: '11:11', endTime: '12:30', room: '303' },
    { day: 'Tuesday', startTime: '11:11', endTime: '12:30', room: '303' },
  ]);
});

test('lab offerings use exactly one UIU lab day and a fixed lab slot', () => {
  const course = findCatalogCourse('CSE 2218');
  assert.ok(course);
  assert.equal(course.kind, 'lab');
  for (const section of course.sections) {
    assert.equal(section.timeSlots.length, 1);
    const duration =
      Number(section.timeSlots[0].endTime.slice(0, 2)) * 60 +
      Number(section.timeSlots[0].endTime.slice(3)) -
      (Number(section.timeSlots[0].startTime.slice(0, 2)) * 60 +
        Number(section.timeSlots[0].startTime.slice(3)));
    assert.ok(duration === 149 || duration === 150);
  }
});

test('catalog suggestions and workspace validation accept generated data', () => {
  assert.equal(suggestCatalogCourses('data structure')[0]?.code, 'CSE 2215');
  assert.equal(offeringsForCourse('CSE 2217').length, 12);
  assert.doesNotThrow(() =>
    validateCourses(
      COURSE_CATALOG.courses.map((course) => ({ ...course, color: 'indigo' })),
    ),
  );
});
