import { useState, useEffect, useRef } from 'react';
import { SAMPLE_COURSES } from '../sampleData';
import { Workspace, decodeBackup, validateCourses, validSelections } from '../lib/workspace';
const KEY = 'sectionsync.workspace.v2';
function load(): { data: Workspace; error: string } {
  try {
    const current = localStorage.getItem(KEY);
    if (current) {
      const raw = JSON.parse(current);
      return {
        data: {
          ...decodeBackup(raw),
          hideConflicted: raw.hideConflicted !== false,
          updatedAt: raw.updatedAt || new Date().toISOString(),
        },
        error: '',
      };
    }
    const legacy = localStorage.getItem('course_section_planner_courses');
    const courses = validateCourses(legacy ? JSON.parse(legacy) : SAMPLE_COURSES);
    const raw = {
      courses,
      selectedSections: JSON.parse(
        localStorage.getItem('course_section_planner_selections') || '{}',
      ),
      savedPlans: JSON.parse(localStorage.getItem('course_section_planner_saved_plans') || '[]'),
    };
    return {
      data: { ...decodeBackup(raw), hideConflicted: true, updatedAt: new Date().toISOString() },
      error: '',
    };
  } catch (e) {
    return {
      data: {
        courses: validateCourses(SAMPLE_COURSES),
        selectedSections: {},
        savedPlans: [],
        hideConflicted: true,
        updatedAt: new Date().toISOString(),
      },
      error:
        'Existing data could not be read. It has been left untouched. Import a backup or explicitly save a new workspace.',
    };
  }
}
export function useWorkspace() {
  const [initial] = useState(load),
    [data, setData] = useState(initial.data),
    [error, setError] = useState(initial.error),
    [saved, setSaved] = useState(!initial.error),
    [undo, setUndo] = useState<Workspace | null>(null);
  const dirty = useRef(false);
  function persist(next: Workspace) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: '2.0', ...next }));
      setSaved(true);
      setError('');
    } catch {
      setSaved(false);
      setError('Your browser could not save changes. Download a backup before closing this page.');
    }
  }
  const stateRef = useRef(data);
  stateRef.current = data;
  function change(fn: (w: Workspace) => void) {
    const current = stateRef.current,
      next = structuredClone(current);
    fn(next);
    validateCourses(next.courses);
    validSelections(next.courses, next.selectedSections);
    next.updatedAt = new Date().toISOString();
    setUndo(current);
    dirty.current = true;
    setSaved(false);
    stateRef.current = next;
    setData(next);
  }

  useEffect(() => {
    if (dirty.current) {
      persist(data);
      dirty.current = false;
    }
  }, [data]);
  return {
    data,
    error,
    saved,
    undo,
    change,
    save: () => persist(data),
    undoChange: () => {
      if (undo) {
        setData(undo);
        setUndo(null);
        persist(undo);
      }
    },
    replace: (next: Workspace) => {
      setUndo(data);
      setData(next);
      persist(next);
    },
  };
}
