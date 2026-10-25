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

export const CATALOG_META = { program: 'BSCSE', label: 'Fall 2026', term: 'fall' };
let pendingCatalog: Promise<CourseCatalog> | undefined;
let loadedCatalog: CourseCatalog | undefined;
export function loadCatalog(): Promise<CourseCatalog> {
  return pendingCatalog ||= import('../data/catalogs/fall-2026-bscse.json').then((module) => {
    loadedCatalog = module.default as unknown as CourseCatalog;
    return loadedCatalog;
  }).catch((error) => { pendingCatalog = undefined; throw error; });
}

export function normalizeCourseCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '').replace(/^([A-Z]+)(\d)/, '$1 $2');
}

export function findCatalogCourse(code: string) {
  const normalized = normalizeCourseCode(code);
  return loadedCatalog?.courses.find((course) => course.code === normalized);
}

export function suggestCatalogCourses(query: string, limit = 12) {
  const normalized = normalizeCourseCode(query);
  if (!normalized) return loadedCatalog?.courses.slice(0, limit) || [];
  return (loadedCatalog?.courses || [])
    .filter(
      (course) =>
        course.code.includes(normalized) || course.title.toUpperCase().includes(query.trim().toUpperCase()),
    )
    .slice(0, limit);
}

export function offeringsForCourse(code: string): CatalogSection[] {
  return findCatalogCourse(code)?.sections || [];
}

export function sameText(a: string, b: string) {
  return a.trim().localeCompare(b.trim(), undefined, { sensitivity: 'base' }) === 0;
}
