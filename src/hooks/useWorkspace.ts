import { useState, useEffect, useRef, useReducer } from 'react';
import { SAMPLE_COURSES } from '../sampleData';
import { Workspace, decodeBackup, validateCourses, validSelections } from '../lib/workspace';
import { historyReducer, History, HistoryAction } from '../lib/history';
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
  const [initial] = useState(load);
  const [history, dispatch] = useReducer(historyReducer<Workspace>, {
    present: initial.data,
    past: [],
    future: [],
  });
  const [error, setError] = useState(initial.error);
  const [saved, setSaved] = useState(!initial.error);
  const stateRef = useRef<History<Workspace>>(history);
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
  function apply(action: HistoryAction<Workspace>) {
    const next = historyReducer(stateRef.current, action);
    if (next === stateRef.current) return;
    stateRef.current = next;
    dirty.current = true;
    setSaved(false);
    dispatch(action);
  }
  function replace(next: Workspace) {
    const snapshot = structuredClone(next);
    snapshot.courses = validateCourses(snapshot.courses);
    snapshot.selectedSections = validSelections(snapshot.courses, snapshot.selectedSections);
    snapshot.updatedAt = new Date().toISOString();
    apply({ type: 'change', next: snapshot });
  }
  useEffect(() => {
    if (dirty.current) {
      persist(history.present);
      dirty.current = false;
    }
  }, [history]);
  return {
    data: history.present,
    error,
    saved,
    undo: history.past.length > 0,
    redo: history.future.length > 0,
    undoCount: history.past.length,
    redoCount: history.future.length,
    change: (fn: (w: Workspace) => void) => {
      const next = structuredClone(stateRef.current.present);
      fn(next);
      replace(next);
    },
    replace,
    save: () => persist(stateRef.current.present),
    undoChange: () => apply({ type: 'undo' }),
    redoChange: () => apply({ type: 'redo' }),
  };
}
