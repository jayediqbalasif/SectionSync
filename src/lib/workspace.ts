import {
  Course,
  Section,
  SavedPlan,
  DayOfWeek,
  DAYS_OF_WEEK,
  sectionsConflict,
  parseTimeToMinutes,
} from '../types';
export type Workspace = {
  courses: Course[];
  selectedSections: Record<string, string>;
  savedPlans: SavedPlan[];
  hideConflicted: boolean;
  updatedAt: string;
};
export function validateCourses(value: unknown): Course[] {
  if (!Array.isArray(value) || value.length > 500)
    throw new Error('Expected a course list with at most 500 courses.');
  const seen = new Set<string>(),
    sections = new Set<string>();
  return value.map((c) => {
    if (
      !c ||
      typeof c.id !== 'string' ||
      !c.id ||
      seen.has(c.id) ||
      typeof c.code !== 'string' ||
      !c.code.trim() ||
      typeof c.title !== 'string' ||
      !c.title.trim() ||
      !Array.isArray(c.sections)
    )
      throw new Error('A course has missing or duplicate fields.');
    seen.add(c.id);
    const credits = c.credits ?? 3;
    if (typeof credits !== 'number' || !Number.isFinite(credits) || credits < 0 || credits > 12)
      throw new Error('Credits must be between 0 and 12.');
    if (c.sections.length > 200) throw new Error('A course cannot contain more than 200 sections.');
    return {
      ...c,
      code: c.code.trim(),
      title: c.title.trim(),
      credits,
      kind: c.kind === 'lab' ? 'lab' : 'theory',
      sections: c.sections.map((s: any) => {
        if (
          !s ||
          typeof s.id !== 'string' ||
          !s.id ||
          sections.has(s.id) ||
          typeof s.name !== 'string' ||
          !s.name.trim() ||
          typeof s.faculty !== 'string'
        )
          throw new Error('Invalid or duplicate section.');
        sections.add(s.id);
        validateMeetings(s.timeSlots);
        return {
          ...s,
          preferenceOrder:
            Number.isInteger(s.preferenceOrder) && s.preferenceOrder > 0 ? s.preferenceOrder : 1,
        };
      }),
    };
  });
}
export function validateMeetings(value: unknown): asserts value is Section['timeSlots'] {
  if (!Array.isArray(value) || !value.length || value.length > 30)
    throw new Error('Add between 1 and 30 meetings.');
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  for (const m of value)
    if (
      !m ||
      (m.room !== undefined && typeof m.room !== 'string') ||
      !DAYS_OF_WEEK.includes(m.day) ||
      !time.test(m.startTime) ||
      !time.test(m.endTime) ||
      m.startTime >= m.endTime
    )
      throw new Error('Each meeting needs a valid day and an end time after its start.');
  for (let i = 0; i < value.length; i++)
    for (let j = i + 1; j < value.length; j++) {
      const a = value[i],
        b = value[j];
      if (a.day === b.day && a.startTime < b.endTime && b.startTime < a.endTime)
        throw new Error('Meetings within a section cannot overlap.');
    }
}
export function validSelections(courses: Course[], value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const entries = Object.entries(value);
  if (
    entries.some(
      ([cid, sid]) =>
        typeof sid !== 'string' ||
        !courses.find((c) => c.id === cid)?.sections.some((s) => s.id === sid),
    )
  )
    throw new Error('A saved selection refers to a missing course or section.');
  const selected = Object.fromEntries(entries) as Record<string, string>;
  const items = chosen(courses, selected);
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++)
      if (sectionsConflict(items[i].section, items[j].section))
        throw new Error('Selected sections overlap. Resolve the conflict before importing.');
  return selected;
}
export function sanitizeSelections(courses: Course[], value: unknown) {
  const selections: Record<string, string> = {};
  let removed = 0;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { selections, removed };
  for (const [courseId, sectionId] of Object.entries(value)) {
    const section = courses.find((course) => course.id === courseId)?.sections.find((section) => section.id === sectionId);
    if (!section || findConflicts(courses, selections, courseId, section).length) removed++;
    else selections[courseId] = section.id;
  }
  return { selections, removed };
}

export function chosen(courses: Course[], selected: Record<string, string>) {
  return courses.flatMap((course) => {
    const section = course.sections.find((s) => s.id === selected[course.id]);
    return section ? [{ course, section }] : [];
  });
}
export function findConflicts(
  courses: Course[],
  selected: Record<string, string>,
  courseId: string,
  section: Section,
) {
  return chosen(courses, selected).filter(
    (x) => x.course.id !== courseId && sectionsConflict(x.section, section),
  );
}
export function summary(courses: Course[], selected: Record<string, string>) {
  const items = chosen(courses, selected),
    days = new Map<DayOfWeek, Section['timeSlots']>();
  for (const { section } of items)
    for (const m of section.timeSlots) days.set(m.day, [...(days.get(m.day) || []), m]);
  let gap = 0;
  for (const meetings of days.values()) {
    meetings.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
    for (let i = 1; i < meetings.length; i++)
      gap += Math.max(
        0,
        parseTimeToMinutes(meetings[i].startTime) - parseTimeToMinutes(meetings[i - 1].endTime),
      );
  }
  return {
    earliest: [...days.values()].flat().map((m) => m.startTime).sort()[0],
    latest: [...days.values()].flat().map((m) => m.endTime).sort().at(-1),
    freeWeekdays: DAYS_OF_WEEK.slice(0, 5).filter((day) => !days.has(day)).length,
    count: items.length,
    credits: items.reduce((n, x) => n + (x.course.credits ?? 3), 0),
    days: days.size,
    gap,
    meetings: items.reduce((n, x) => n + x.section.timeSlots.length, 0),
  };
}
export const label = (s: Section) => s.name.replace(/\s*\(.*\)$/, '').replace(/^Sec\s*/i, '');
export function moveSection(course: Course, id: string, target: number) {
  const list = [...course.sections].sort((a, b) => a.preferenceOrder - b.preferenceOrder),
    from = list.findIndex((s) => s.id === id);
  if (from < 0) return course;
  const [item] = list.splice(from, 1);
  list.splice(Math.max(0, Math.min(target, list.length)), 0, item);
  return { ...course, sections: list.map((s, i) => ({ ...s, preferenceOrder: i + 1 })) };
}
export function decodeBackup(
  raw: unknown,
): Pick<Workspace, 'courses' | 'selectedSections' | 'savedPlans'> {
  const data = raw as any;
  if (!data || typeof data !== 'object') throw new Error('This is not a SectionSync backup.');
  if (data.version && !['1.0', '2.0'].includes(data.version))
    throw new Error('Unsupported backup version.');
  const courses = validateCourses(data.courses),
    selectedSections = validSelections(courses, data.selectedSections || {});
  const plans = data.savedPlans ?? [];
  if (!Array.isArray(plans) || plans.length > 1000) throw new Error('Invalid saved plans.');
  const savedPlans = plans.map((p: any) => {
    if (
      !p ||
      typeof p.id !== 'string' ||
      !p.id ||
      typeof p.name !== 'string' ||
      !p.name.trim() ||
      typeof p.savedAt !== 'string'
    )
      throw new Error('Invalid saved plan.');
    const courses = validateCourses(p.courses);
    return { ...p, courses, selectedSections: validSelections(courses, p.selectedSections || {}) };
  });
  if (new Set(savedPlans.map((p) => p.id)).size !== savedPlans.length)
    throw new Error('Duplicate plan identifiers.');
  return { courses, selectedSections, savedPlans };
}
export function download(name: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function writeWorkspace(storage: Pick<Storage, 'setItem'>, next: Workspace, recoveryRaw: string | null) {
  if (recoveryRaw !== null) throw new Error('Download the original data or explicitly replace it before saving this workspace.');
  storage.setItem('sectionsync.workspace.v2', JSON.stringify({ version: '2.0', ...next }));
}
