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
  writeWorkspace,
  sanitizeSelections,
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
  assert.throws(() => validateMeetings([{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: { bad: true } }]));
  assert.doesNotThrow(() => validateMeetings([{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '304' }]));
  assert.throws(() => validateMeetings([{ day: 'Monday', startTime: '25:00', endTime: '26:00' }]));
  assert.throws(() => validateMeetings([{ day: 'Monday', startTime: '12:00', endTime: '11:00' }]));
  assert.throws(() => validateMeetings([...section('a').timeSlots, ...section('b').timeSlots]));
});

test('recovery blocks all automatic writes until explicitly cleared', () => {
  const writes: string[] = [];
  const storage = { setItem: (_key: string, value: string) => writes.push(value) };
  const workspace = { courses: [], selectedSections: {}, savedPlans: [], hideConflicted: true, updatedAt: '2026-10-25' };
  assert.throws(() => writeWorkspace(storage, workspace, '{broken original'));
  assert.throws(() => writeWorkspace(storage, workspace, ''));
  assert.equal(writes.length, 0);
  writeWorkspace(storage, workspace, null);
  assert.equal(writes.length, 1);
  assert.equal(JSON.parse(writes[0]).version, '2.0');
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

test('stored selections drop dangling and later overlapping entries without blocking save', () => {
  const courses = [course('a', [section('a')]), course('b', [section('b')]), course('c', [section('c', '11:00', '12:00')])];
  const cleaned = sanitizeSelections(courses, { a: 'a', b: 'b', c: 'missing', gone: 'gone' });
  assert.deepEqual(cleaned, { selections: { a: 'a' }, removed: 3 });
  const data = decodeBackup({ courses, selectedSections: cleaned.selections });
  assert.doesNotThrow(() => writeWorkspace({ setItem() {} }, { ...data, hideConflicted: true, updatedAt: '' }, null));
  assert.throws(() => decodeBackup({ courses: [{}], selectedSections: cleaned.selections }));
  assert.throws(() => decodeBackup({ courses, savedPlans: [{ id: 'p', name: 'Plan', savedAt: '', courses, selectedSections: { a: 'missing' } }] }));
});
test('routine facts include first start, final finish and free weekdays', () => {
  const courses = [course('a', [section('a')]), course('b', [section('b', '11:00', '12:30')])];
  const stats = summary(courses, { a: 'a', b: 'b' });
  assert.equal(stats.earliest, '09:00');
  assert.equal(stats.latest, '12:30');
  assert.equal(stats.freeWeekdays, 4);
  assert.equal(summary([], {}).earliest, undefined);
});
