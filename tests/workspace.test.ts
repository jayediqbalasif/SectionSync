import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCourses,
  validateMeetings,
  validSelections,
  decodeBackup,
  moveSection,
  summary,
  findConflicts,
} from '../src/lib/workspace';
import { Course, Section, sectionsConflict } from '../src/types';
const section = (id: string, start = '09:00', end = '10:00'): Section => ({
  id,
  name: id,
  faculty: 'Faculty',
  preferenceOrder: 1,
  timeSlots: [{ day: 'Monday', startTime: start, endTime: end }],
});
const course = (id: string, sections: Section[], credits = 3): Course => ({
  id,
  code: id,
  title: id,
  color: 'indigo',
  credits,
  kind: 'theory',
  sections,
});
test('meetings allow back-to-back classes but reject overlaps', () => {
  assert.equal(sectionsConflict(section('a'), section('b', '10:00', '11:00')), false);
  assert.equal(sectionsConflict(section('a'), section('b', '09:30', '11:00')), true);
});
test('invalid, reversed and self-overlapping meetings are rejected', () => {
  assert.throws(() => validateMeetings([{ day: 'Monday', startTime: '25:00', endTime: '26:00' }]));
  assert.throws(() => validateMeetings([{ day: 'Monday', startTime: '12:00', endTime: '11:00' }]));
  assert.throws(() => validateMeetings([...section('a').timeSlots, ...section('b').timeSlots]));
});
test('legacy course credits are migrated without changing identifiers', () => {
  const c = course('a', [section('a1')]);
  delete c.credits;
  const [m] = validateCourses([c]);
  assert.equal(m.credits, 3);
  assert.equal(m.id, 'a');
});
test('duplicate course and section IDs are rejected', () => {
  assert.throws(() => validateCourses([course('a', []), course('a', [])]));
  assert.throws(() => validateCourses([course('a', [section('x')]), course('b', [section('x')])]));
});
test('invalid credit values are rejected', () => {
  assert.throws(() => validateCourses([course('a', [], -1)]));
  assert.throws(() => validateCourses([course('a', [], NaN)]));
});
test('section reordering normalizes priorities and preserves source', () => {
  const c = course('a', [
    { ...section('a'), preferenceOrder: 1 },
    { ...section('b'), preferenceOrder: 2 },
    { ...section('c'), preferenceOrder: 3 },
  ]);
  const r = moveSection(c, 'c', 0);
  assert.deepEqual(
    r.sections.map((s) => s.id),
    ['c', 'a', 'b'],
  );
  assert.deepEqual(
    r.sections.map((s) => s.preferenceOrder),
    [1, 2, 3],
  );
  assert.equal(c.sections[0].id, 'a');
});
test('credits and idle gaps are calculated from real selections', () => {
  const c = [course('a', [section('a')], 1), course('b', [section('b', '11:00', '12:00')], 4)];
  const s = summary(c, { a: 'a', b: 'b' });
  assert.equal(s.credits, 5);
  assert.equal(s.gap, 60);
  assert.equal(s.days, 1);
});
test('conflict lookup excludes the course being replaced', () => {
  const c = [course('a', [section('a'), section('a2')]), course('b', [section('b')])];
  assert.deepEqual(
    findConflicts(c, { a: 'a', b: 'b' }, 'a', section('a2')).map((x) => x.course.id),
    ['b'],
  );
});
test('dangling selections and conflicting backups are rejected', () => {
  const courses = [course('a', [section('a')]), course('b', [section('b')])];
  assert.throws(() => validSelections(courses, { a: 'missing' }));
  assert.throws(() => decodeBackup({ courses, selectedSections: { a: 'a', b: 'b' } }));
});
test('original backup format restores independently saved plans', () => {
  const courses = [course('a', [section('a')])];
  const result = decodeBackup({
    app: 'SectionSync',
    version: '1.0',
    courses,
    selectedSections: { a: 'a' },
    savedPlans: [
      {
        id: 'p1',
        name: 'Plan A',
        savedAt: new Date().toISOString(),
        courses,
        selectedSections: { a: 'a' },
      },
    ],
  });
  assert.equal(result.savedPlans[0].name, 'Plan A');
  assert.equal(result.selectedSections.a, 'a');
});
test('unsupported backup versions and duplicate saved plans are rejected', () => {
  assert.throws(() => decodeBackup({ version: '3.0', courses: [] }));
  const p = { id: 'x', name: 'A', savedAt: '2026-10-21', courses: [], selectedSections: {} };
  assert.throws(() => decodeBackup({ courses: [], savedPlans: [p, p] }));
});
