import { useState, useEffect, useRef, useReducer } from 'react';
import { SAMPLE_COURSES } from '../sampleData';
import { Workspace, decodeBackup, validateCourses, validSelections, sanitizeSelections, writeWorkspace } from '../lib/workspace';
import { historyReducer, History, HistoryAction } from '../lib/history';
const KEY = 'sectionsync.workspace.v2';
function load(): { data: Workspace; error: string; recoveryRaw?: string; removed?: number } {
  let original = '';
  try {
    const current = localStorage.getItem(KEY);
    original = current || '';
    if (current) {
      const raw = JSON.parse(current);
      const cleaned = sanitizeSelections(validateCourses(raw.courses), raw.selectedSections);
      return {
        removed: cleaned.removed,
        data: {
          ...decodeBackup({ ...raw, selectedSections: cleaned.selections }),
          hideConflicted: raw.hideConflicted !== false,
          updatedAt: raw.updatedAt || new Date().toISOString(),
        },
        error: '',
      };
    }
    const legacy = localStorage.getItem('course_section_planner_courses');
    original = JSON.stringify({ courses: legacy, selections: localStorage.getItem('course_section_planner_selections'), savedPlans: localStorage.getItem('course_section_planner_saved_plans') });
    const courses = validateCourses(legacy ? JSON.parse(legacy) : SAMPLE_COURSES);
    const raw = {
      courses,
      selectedSections: JSON.parse(
        localStorage.getItem('course_section_planner_selections') || '{}',
      ),
      savedPlans: JSON.parse(localStorage.getItem('course_section_planner_saved_plans') || '[]'),
    };
    const cleaned = sanitizeSelections(courses, raw.selectedSections);
    return {
      removed: cleaned.removed,
      data: { ...decodeBackup({ ...raw, selectedSections: cleaned.selections }), hideConflicted: true, updatedAt: new Date().toISOString() },
      error: '',
    };
  } catch (e) {
    return {
      recoveryRaw: original,
      data: {
        courses: validateCourses(SAMPLE_COURSES),
        selectedSections: {},
        savedPlans: [],
        hideConflicted: true,
        updatedAt: new Date().toISOString(),
      },
      error:
        'Existing data could not be read. Saving is blocked to protect it. Download the original data, then restore a backup or explicitly use the current workspace.',
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
  const [removed, setRemoved] = useState(initial.removed || 0);
  const [externalChange, setExternalChange] = useState(false);
  const [error, setError] = useState(initial.error);
  const [recoveryRaw, setRecoveryRaw] = useState<string | null>(initial.recoveryRaw ?? null);
  const recoveryRef = useRef(recoveryRaw);
  const [saved, setSaved] = useState(!initial.error);
  const stateRef = useRef<History<Workspace>>(history);
  const dirty = useRef(false);
  function persist(next: Workspace) {
    try {
      writeWorkspace(localStorage, next, recoveryRef.current);
      setSaved(true);
      setError('');
      return true;
    } catch (caught) {
      setSaved(false);
      setError(recoveryRef.current !== null ? (caught as Error).message : 'Your browser could not save changes. Download a backup before closing this page.');
      return false;
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
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.storageArea === localStorage && (event.key === KEY || event.key === null)) setExternalChange(true);
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  return {
    removed,
    externalChange,
    reloadWorkspace: () => {
      const next = load();
      const action: HistoryAction<Workspace> = { type: 'reset', next: next.data };
      stateRef.current = historyReducer(stateRef.current, action);
      dirty.current = false;
      recoveryRef.current = next.recoveryRaw ?? null;
      setRecoveryRaw(next.recoveryRaw ?? null);
      setError(next.error);
      setRemoved(next.removed || 0);
      setSaved(!next.error);
      setExternalChange(false);
      dispatch(action);
    },
    data: history.present,
    error,
    recoveryRaw,
    replaceRecoveredData: () => {
      recoveryRef.current = null;
      setRecoveryRaw(null);
      persist(stateRef.current.present);
    },
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
