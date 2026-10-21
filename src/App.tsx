/** @license SPDX-License-Identifier: Apache-2.0 */
import { useState, useEffect, useRef } from 'react';
import {
  Layers,
  LayoutGrid,
  ArrowUpRight,
  Plus,
  Download,
  Bookmark,
  X,
  Undo2,
  Redo2,
  Check,
  HardDrive,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { Course, Section, SavedPlan } from './types';
import { SAMPLE_COURSES } from './sampleData';
import { useWorkspace } from './hooks/useWorkspace';
import {
  chosen,
  findConflicts,
  label,
  moveSection,
  decodeBackup,
  download,
  validateCourses,
  summary,
} from './lib/workspace';
import { PlannerPage } from './components/PlannerPage';
import { RoutinePage } from './components/RoutinePage';
import { HomePage } from './components/HomePage';
import { FaqPage } from './components/FaqPage';
import { Dialog } from './components/Dialog';

type Page = 'home' | 'planner' | 'routine' | 'faq';
type Theme = 'light' | 'dark';

function ImportTrayIcon({
  size = 16,
  strokeWidth = 1.8,
}: {
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5" />
    </svg>
  );
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('sectionsync.theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

const route = (): Page => {
  const path = location.hash;
  if (path.startsWith('#/planner')) return 'planner';
  if (path.startsWith('#/routine')) return 'routine';
  if (path.startsWith('#/faq')) return 'faq';
  return 'home';
};
export default function App() {
  const {
    data: w,
    error,
    saved,
    undo,
    redo,
    undoCount,
    redoCount,
    change,
    replace,
    save,
    undoChange,
    redoChange,
  } = useWorkspace();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [page, setPage] = useState<Page>(route),
    [courseEdit, setCourseEdit] = useState<Course | 'new' | null>(null),
    [saveOpen, setSaveOpen] = useState(false),
    [help, setHelp] = useState(false),
    [confirm, setConfirm] = useState<{
      title: string;
      body: string;
      action: () => void;
      label?: string;
    } | null>(null),
    [toast, setToast] = useState(''),
    [copied, setCopied] = useState<Course | null>(null),
    [planName, setPlanName] = useState(''),
    [planNote, setPlanNote] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('sectionsync.theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };
  const notify = (msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 4500);
  };
  function navigate(p: Page) {
    location.hash = `/${p}`;
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  useEffect(() => {
    const f = () => {
      setPage(route());
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', f);
    return () => {
      window.removeEventListener('hashchange', f);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
        notify('Workspace saved on this device.');
      } else if (!isInput && (e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undo) {
          undoChange();
          notify('Undo last change.');
        }
      } else if (
        !isInput &&
        ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey)))
      ) {
        e.preventDefault();
        if (redo) {
          redoChange();
          notify('Redo change.');
        }
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [w, undo, redo, undoChange, redoChange]);
  const stats = summary(w.courses, w.selectedSections),
    selected = chosen(w.courses, w.selectedSections);
  function exportBackup() {
    download(
      `sectionsync-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(
        { app: 'SectionSync', version: '2.0', exportedAt: new Date().toISOString(), ...w },
        null,
        2,
      ),
    );
    notify('Backup downloaded.');
  }
  async function importFile(f: File) {
    try {
      if (f.size > 10 * 1024 * 1024) throw new Error('Choose a backup smaller than 10 MB.');
      const parsed = decodeBackup(JSON.parse(await f.text()));
      setConfirm({
        title: 'Restore this backup?',
        body: `Replace your course library and selections with ${parsed.courses.length} courses from this file. Incoming saved plans will be merged with your existing plans. You can undo this change.`,
        label: 'Restore backup',
        action: () => {
          change((d) => {
            d.courses = parsed.courses;
            d.selectedSections = parsed.selectedSections;
            const plans = new Map(d.savedPlans.map((p) => [p.id, p]));
            parsed.savedPlans.forEach((p) => plans.set(p.id, p));
            d.savedPlans = [...plans.values()];
          });
          notify('Backup restored.');
        },
      });
    } catch (e) {
      notify((e as Error).message);
    }
  }
  function pick(c: Course, s: Section) {
    if (w.selectedSections[c.id] === s.id) {
      change((d) => {
        delete d.selectedSections[c.id];
      });
      return;
    }
    const clashes = findConflicts(w.courses, w.selectedSections, c.id, s);
    const apply = () => {
      change((d) => {
        clashes.forEach((x) => delete d.selectedSections[x.course.id]);
        d.selectedSections[c.id] = s.id;
      });
      if (clashes.length) notify('Conflicting sections replaced. Undo is available.');
    };
    if (clashes.length)
      setConfirm({
        title: 'Replace overlapping sections?',
        body: `${c.code} section ${label(s)} overlaps ${clashes.map((x) => x.course.code).join(', ')}. Those selections will be removed; their courses stay in your library.`,
        label: 'Replace selections',
        action: apply,
      });
    else apply();
  }
  function saveSection(c: Course, s: Section) {
    const isEdit = c.sections.some((x) => x.id === s.id);
    change((d) => {
      const course = d.courses.find((x) => x.id === c.id)!;
      const others = course.sections
        .filter((x) => x.id !== s.id)
        .sort((a, b) => a.preferenceOrder - b.preferenceOrder);
      others.splice(Math.min(s.preferenceOrder - 1, others.length), 0, s);
      course.sections = others.map((x, i) => ({ ...x, preferenceOrder: i + 1 }));
      if (d.selectedSections[c.id] === s.id) {
        const clashes = findConflicts(d.courses, d.selectedSections, c.id, s);
        if (clashes.length) delete d.selectedSections[c.id];
      }
    });
    notify(isEdit ? 'Section updated.' : 'Section added.');
  }
  const safe = (action: () => void) => {
    try {
      action();
    } catch (e) {
      notify((e as Error).message);
    }
  };
  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="#/home"
          onClick={(e) => {
            e.preventDefault();
            navigate('home');
          }}
        >
          <span className="brand-symbol">
            <Layers size={19} strokeWidth={1.7} />
          </span>
          SectionSync<span className="brand-period">.</span>
        </a>
        <nav className="header-nav" aria-label="Main navigation">
          {(['home', 'planner', 'routine', 'faq'] as Page[]).map((item, index) => (
            <a
              key={item}
              href={`#/${item}`}
              aria-current={page === item ? 'page' : undefined}
              className={page === item ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigate(item);
              }}
            >
              <span>[ 0{index} ]</span>{' '}
              {item === 'faq' ? 'FAQ' : item.charAt(0).toUpperCase() + item.slice(1)}
            </a>
          ))}
        </nav>
        <div className="header-tools">
          <span className="header-status" role="status">
            <span className={`status-dot ${saved ? '' : 'unsaved'}`} />
            {saved ? 'Saved on this device' : 'Save failed'}
          </span>
          <button
            className="icon-button"
            disabled={!undo}
            onClick={undoChange}
            aria-label="Undo last change"
            title={undo ? `Undo last change (${undoCount}/5) — ⌘Z` : 'Nothing to undo'}
          >
            <Undo2 size={16} />
          </button>
          <button
            className="icon-button"
            disabled={!redo}
            onClick={redoChange}
            aria-label="Redo change"
            title={redo ? `Redo change (${redoCount}/5) — ⌘⇧Z` : 'Nothing to redo'}
          >
            <Redo2 size={16} />
          </button>
          <button
            className="icon-button"
            onClick={() => file.current?.click()}
            aria-label="Import backup"
            title="Import backup"
          >
            <ImportTrayIcon size={16} />
          </button>
          <button
            className="icon-button"
            onClick={() => setHelp(true)}
            aria-label="Storage & backups"
            title="Storage & backups"
          >
            <HardDrive size={16} />
          </button>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>
      <div className="main-shell">
        <main id="main">
          {error && (
            <div role="alert" className="notice error">
              {error}
              <button className="text-button" onClick={save}>
                Retry save
              </button>
            </div>
          )}
          {page === 'faq' ? (
            <FaqPage />
          ) : page === 'home' ? (
            <HomePage onPlanner={() => navigate('planner')} onRoutine={() => navigate('routine')} />
          ) : page === 'planner' ? (
            <PlannerPage
              workspace={w}
              copied={copied}
              onPick={pick}
              onEditCourse={(c) => setCourseEdit(c || 'new')}
              onRoutine={() => navigate('routine')}
              onHide={() =>
                change((d) => {
                  d.hideConflicted = !d.hideConflicted;
                })
              }
              onSection={(c, s) => safe(() => saveSection(c, s))}
              onReorder={(c, s, index) =>
                change((d) => {
                  d.courses = d.courses.map((x) =>
                    x.id === c.id ? moveSection(x, s.id, index) : x,
                  );
                })
              }
              onDeleteCourse={(c) =>
                setConfirm({
                  title: `Delete ${c.code}?`,
                  body: 'The course and its sections will leave your library. Saved plans keep their own copies. You can undo this change.',
                  label: 'Delete course',
                  action: () =>
                    change((d) => {
                      d.courses = d.courses.filter((x) => x.id !== c.id);
                      delete d.selectedSections[c.id];
                    }),
                })
              }
              onDeleteSection={(c, s) =>
                setConfirm({
                  title: `Delete section ${label(s)}?`,
                  body: `This removes the section from ${c.code}. You can undo this change.`,
                  label: 'Delete section',
                  action: () =>
                    change((d) => {
                      const course = d.courses.find((x) => x.id === c.id)!;
                      course.sections = course.sections
                        .filter((x) => x.id !== s.id)
                        .sort((a, b) => a.preferenceOrder - b.preferenceOrder)
                        .map((x, i) => ({ ...x, preferenceOrder: i + 1 }));
                      if (d.selectedSections[c.id] === s.id) delete d.selectedSections[c.id];
                    }),
                })
              }
              onCopy={(c) => {
                setCopied(structuredClone(c));
                notify(`Sections copied from ${c.code}.`);
              }}
              onPaste={(c) => {
                if (!copied) return;
                setConfirm({
                  title: `Paste sections into ${c.code}?`,
                  body: `Replace this course’s section options with the ${copied.sections.length} sections copied from ${copied.code}. Its current selection will be cleared.`,
                  label: 'Paste sections',
                  action: () =>
                    change((d) => {
                      const course = d.courses.find((x) => x.id === c.id)!;
                      course.sections = copied.sections.map((s) => ({
                        ...structuredClone(s),
                        id: crypto.randomUUID(),
                      }));
                      delete d.selectedSections[c.id];
                    }),
                });
              }}
            />
          ) : (
            <RoutinePage
              workspace={w}
              onPlanner={() => navigate('planner')}
              onSave={() => setSaveOpen(true)}
              onLoad={(p) =>
                setConfirm({
                  title: `Open ${p.name}?`,
                  body: 'This will replace your active course library and selections. Your saved plans stay. You can undo this change.',
                  label: 'Open plan',
                  action: () =>
                    change((d) => {
                      d.courses = structuredClone(p.courses);
                      d.selectedSections = { ...p.selectedSections };
                    }),
                })
              }
              onDelete={(p) =>
                setConfirm({
                  title: `Delete ${p.name}?`,
                  body: 'The saved copy will be removed. Your current routine stays. You can undo this change.',
                  label: 'Delete plan',
                  action: () =>
                    change((d) => {
                      d.savedPlans = d.savedPlans.filter((x) => x.id !== p.id);
                    }),
                })
              }
              onExport={exportBackup}
              onPrint={() => window.print()}
            />
          )}
          <footer className="page-footer">
            <span>
              SectionSync <b>·</b> LOCAL-FIRST COURSE PLANNING
            </span>
            <span>
              <HardDrive size={12} /> Local workspace
            </span>
          </footer>
        </main>
      </div>
      <input
        ref={file}
        type="file"
        accept=".json"
        className="visually-hidden"
        aria-label="Import SectionSync backup"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importFile(f);
          e.target.value = '';
        }}
      />
      {courseEdit && (
        <CourseDialog
          course={courseEdit === 'new' ? undefined : courseEdit}
          onClose={() => setCourseEdit(null)}
          onSave={(c) => {
            if (
              w.courses.some((x) => x.id !== c.id && x.code.toLowerCase() === c.code.toLowerCase())
            )
              throw new Error('A course with that code already exists.');
            change((d) => {
              const index = d.courses.findIndex((x) => x.id === c.id);
              if (index >= 0) d.courses[index] = c;
              else d.courses.push(c);
            });
            setCourseEdit(null);
          }}
        />
      )}
      {saveOpen && (
        <Dialog title="Save a plan" onClose={() => setSaveOpen(false)}>
          <p className="muted">Keep a copy before trying a different set of sections.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!planName.trim()) {
                notify('Give this plan a name.');
                return;
              }
              change((d) => {
                d.savedPlans.unshift({
                  id: crypto.randomUUID(),
                  name: planName.trim(),
                  note: planNote.trim(),
                  savedAt: new Date().toISOString(),
                  courses: structuredClone(d.courses),
                  selectedSections: { ...d.selectedSections },
                });
              });
              setSaveOpen(false);
              setPlanName('');
              setPlanNote('');
              notify('Plan saved on this device.');
            }}
          >
            <label>
              Plan name
              <input
                required
                maxLength={100}
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Plan A — mornings"
              />
            </label>
            <label>
              Note <span className="muted">(optional)</span>
              <textarea
                maxLength={1000}
                rows={3}
                value={planNote}
                onChange={(e) => setPlanNote(e.target.value)}
                placeholder="What works about this schedule?"
              />
            </label>
            <div className="save-summary">
              {stats.count} selected courses · {stats.credits} credits · {stats.days} campus days
            </div>
            <div className="dialog-actions">
              <button type="button" className="button" onClick={() => setSaveOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="button primary">
                Save plan <Bookmark size={14} />
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {confirm && (
        <Dialog title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="muted">{confirm.body}</p>
          <div className="dialog-actions">
            <button className="button" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className="button primary"
              onClick={() => {
                safe(confirm.action);
                setConfirm(null);
              }}
            >
              {confirm.label || 'Continue'}
            </button>
          </div>
        </Dialog>
      )}
      {help && (
        <Dialog title="Storage & backups" onClose={() => setHelp(false)}>
          <section className="help-section">
            <HardDrive size={23} />
            <h3>On your device. In this browser.</h3>
            <p>
              Your courses and plans save automatically in local browser storage. Use the same
              website address when you return. Other browsers and devices keep separate workspaces.
            </p>
            <p>
              Clearing site data or using private browsing can remove your work. Download a backup
              to keep an independent copy.
            </p>
            <div className="row wrap">
              <button className="button primary" onClick={exportBackup}>
                <Download size={15} /> Download backup
              </button>
              <button className="button" onClick={() => file.current?.click()}>
                <ImportTrayIcon size={15} /> Restore backup
              </button>
            </div>
          </section>
          <section className="help-section">
            <h3>Starting data</h3>
            <p>
              The starter library is a demonstration from the original project. Older courses
              without credit information default to 3 credits; edit each course to match your
              university’s actual values.
            </p>
            <button
              className="text-button"
              onClick={() => {
                setHelp(false);
                setConfirm({
                  title: 'Load the demo library?',
                  body: 'This replaces your active courses and selections. Saved plans stay. You can undo this change.',
                  label: 'Load demo',
                  action: () =>
                    change((d) => {
                      d.courses = validateCourses(SAMPLE_COURSES);
                      d.selectedSections = {};
                    }),
                });
              }}
            >
              Load demo courses <ArrowUpRight size={13} />
            </button>
          </section>
          <section className="help-section">
            <h3>Keyboard & controls</h3>
            <p>
              Use the arrow controls under each section to change priorities. Drag sections within a
              course for the same result. Press ⌘S or Ctrl+S to save manually.
            </p>
          </section>
        </Dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={15} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
function CourseDialog({
  course,
  onSave,
  onClose,
}: {
  course?: Course;
  onSave: (c: Course) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState(course?.code || ''),
    [title, setTitle] = useState(course?.title || ''),
    [credits, setCredits] = useState(course?.credits ?? 3),
    [kind, setKind] = useState(course?.kind || 'theory'),
    [error, setError] = useState('');
  return (
    <Dialog title={course ? 'Edit course' : 'New course'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            onSave(
              validateCourses([
                {
                  id: course?.id || crypto.randomUUID(),
                  code: code.trim().toUpperCase(),
                  title: title.trim(),
                  credits,
                  kind,
                  color: course?.color || 'indigo',
                  sections: course?.sections || [],
                },
              ])[0],
            );
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <div className="two-columns">
          <label>
            Course code
            <input
              autoFocus
              required
              maxLength={40}
              placeholder="CSE 2217"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <label>
            Credits
            <input
              required
              type="number"
              min="0"
              max="12"
              step="0.5"
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
            />
          </label>
        </div>
        <label>
          Course title
          <input
            required
            maxLength={200}
            placeholder="Data Structure and Algorithms II"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Type
          <select value={kind} onChange={(e) => setKind(e.target.value as 'theory' | 'lab')}>
            <option value="theory">Theory</option>
            <option value="lab">Lab</option>
          </select>
        </label>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button className="button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="submit">
            {course ? 'Save changes' : 'Create course'}
            <ArrowRight size={14} />
          </button>
        </div>
      </form>
    </Dialog>
  );
}
