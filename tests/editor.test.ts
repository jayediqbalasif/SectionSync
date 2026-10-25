import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SectionEditor } from '../src/components/SectionEditor.tsx';
import { RoutinePage } from '../src/components/RoutinePage.tsx';
import { loadCatalog, offeringsForCourse } from '../src/lib/catalog.ts';
import { SAMPLE_COURSES } from '../src/sampleData.ts';

await loadCatalog();

test('editor opens a customized official offering with the saved slot and preview', () => {
  const section = { ...offeringsForCourse('CSE 2217')[0], status: 'customized' as const, timeSlots: [
    { day: 'Sunday' as const, startTime: '08:30', endTime: '09:50', room: '304' },
    { day: 'Wednesday' as const, startTime: '08:30', endTime: '09:50', room: '304' },
  ] };
  const html = renderToStaticMarkup(createElement(SectionEditor, { section, courseCode: 'CSE 2217', kind: 'theory', count: 1, onSave() {}, onCancel() {} }));
  assert.match(html, /<option value="0" selected="">/);
  assert.match(html, /Customized schedule/);
  assert.match(html, /Sunday/);
  assert.match(html, /Existing days, times and rooms are kept/);
});

test('legacy sections keep their existing meeting preview even outside fixed presets', () => {
  const course = SAMPLE_COURSES[0];
  const html = renderToStaticMarkup(createElement(SectionEditor, { section: course.sections[0], courseCode: course.code, kind: 'theory', count: course.sections.length, onSave() {}, onCancel() {} }));
  assert.match(html, /Saved schedule/);
  assert.match(html, /09:00 AM/);
  assert.match(html, /10:30 AM/);
});

test('routine agenda includes complete course, room, faculty and time details', () => {
  const course = { ...SAMPLE_COURSES[0], sections: [{ ...SAMPLE_COURSES[0].sections[0], timeSlots: [{ day: 'Saturday' as const, startTime: '08:30', endTime: '09:50', room: '304' }] }] };
  const html = renderToStaticMarkup(createElement(RoutinePage, { workspace: { courses: [course], selectedSections: { [course.id]: course.sections[0].id }, savedPlans: [], hideConflicted: true, updatedAt: '' }, onPlanner() {}, onSave() {}, onLoad() {}, onDelete() {}, onExport() {}, onPrint() {} }));
  const agenda = html.split('aria-label="Daily class agenda"')[1].split('</section>')[0];
  for (const text of ['Saturday', '304', '08:30 AM', '09:50 AM', course.title, course.sections[0].faculty]) assert.ok(agenda.includes(text));
});
