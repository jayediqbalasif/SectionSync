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
const MAX_HISTORY = 5;

export function useWorkspace() {
  const [initial] = useState(load),
    [data, setData] = useState(initial.data),
    [error, setError] = useState(initial.error),
    [saved, setSaved] = useState(!initial.error),
    [undoStack, setUndoStack] = useState<Workspace[]>([]),
    [redoStack, setRedoStack] = useState<Workspace[]>([]);
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
    setUndoStack((prev) => [...prev.slice(-(MAX_HISTORY - 1)), structuredClone(current)]);
    setRedoStack([]);
    dirty.current = true;
    setSaved(false);
    stateRef.current = next;
    setData(next);
  }

  function undoChange() {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo;
      const previous = prevUndo[prevUndo.length - 1];
      const remainingUndo = prevUndo.slice(0, -1);
      const current = stateRef.current;
      setRedoStack((prevRedo) => [
        ...prevRedo.slice(-(MAX_HISTORY - 1)),
        structuredClone(current),
      ]);
      stateRef.current = previous;
      setData(previous);
      persist(previous);
      return remainingUndo;
    });
  }

  function redoChange() {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const next = prevRedo[prevRedo.length - 1];
      const remainingRedo = prevRedo.slice(0, -1);
      const current = stateRef.current;
      setUndoStack((prevUndo) => [
        ...prevUndo.slice(-(MAX_HISTORY - 1)),
        structuredClone(current),
      ]);
      stateRef.current = next;
      setData(next);
      persist(next);
      return remainingRedo;
    });
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
    undo: undoStack.length > 0,
    redo: redoStack.length > 0,
    undoCount: undoStack.length,
    redoCount: redoStack.length,
    change,
    save: () => persist(data),
    undoChange,
    redoChange,
    replace: (next: Workspace) => {
      setUndoStack((prev) => [
        ...prev.slice(-(MAX_HISTORY - 1)),
        structuredClone(stateRef.current),
      ]);
      setRedoStack([]);
      stateRef.current = next;
      setData(next);
      persist(next);
    },
  };
}
