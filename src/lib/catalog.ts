import catalogJson from '../data/catalogs/fall-2026-bscse.json';
import { Course, Section } from '../types';

export type CatalogSection = Section & {
  facultyInitial?: string;
  catalogOfferingId: string;
  sourceSerial: number;
  sourcePage: number;
  status: 'offered' | 'if-required' | 'tba';
  kind: 'theory' | 'lab';
};

export type CatalogCourse = Omit<Course, 'color' | 'sections'> & {
  catalogId: string;
  program: string;
  sections: CatalogSection[];
};

export type CourseCatalog = {
  schemaVersion: number;
  id: string;
  label: string;
  term: string;
  year: number;
  program: string;
  source: string;
  courses: CatalogCourse[];
};

export const COURSE_CATALOG = catalogJson as unknown as CourseCatalog;

export function normalizeCourseCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, ' ');
}

export function findCatalogCourse(code: string) {
  const normalized = normalizeCourseCode(code);
  return COURSE_CATALOG.courses.find((course) => course.code === normalized);
}

export function suggestCatalogCourses(query: string, limit = 12) {
  const normalized = normalizeCourseCode(query);
  if (!normalized) return COURSE_CATALOG.courses.slice(0, limit);
  return COURSE_CATALOG.courses
    .filter(
      (course) =>
        course.code.includes(normalized) || course.title.toUpperCase().includes(normalized),
    )
    .slice(0, limit);
}

export function offeringsForCourse(code: string): CatalogSection[] {
  return findCatalogCourse(code)?.sections || [];
}

export function sameText(a: string, b: string) {
  return a.trim().localeCompare(b.trim(), undefined, { sensitivity: 'base' }) === 0;
}
