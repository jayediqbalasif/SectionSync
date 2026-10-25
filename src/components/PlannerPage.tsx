import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  Check,
  ArrowRight,
  X,
  Pencil,
  Trash2,
  Copy,
  Clipboard,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  MapPin,
} from 'lucide-react';
import { Course, Section } from '../types';
import { Workspace, chosen, findConflicts, label, summary } from '../lib/workspace';
import { SectionEditor } from './SectionEditor';
import { meetingDisplay } from '../lib/meetingDisplay';
import { CATALOG_META, normalizeCourseCode } from '../lib/catalog';
import { WeekOccupancy } from './WeekOccupancy';
export function PlannerPage({
  workspace: w,
  onPick,
  onEditCourse,
  onDeleteCourse,
  onSection,
  onDeleteSection,
  onReorder,
  onCopy,
  onPaste,
  copied,
  onHide,
  onRoutine,
}: {
  workspace: Workspace;
  onPick: (c: Course, s: Section) => void;
  onEditCourse: (c?: Course) => void;
  onDeleteCourse: (c: Course) => void;
  onSection: (c: Course, s: Section) => void;
  onDeleteSection: (c: Course, s: Section) => void;
  onReorder: (c: Course, s: Section, target: number) => void;
  onCopy: (c: Course) => void;
  onPaste: (c: Course) => void;
  copied: Course | null;
  onHide: () => void;
  onRoutine: () => void;
}) {
  const [search, setSearch] = useState(''),
    [editing, setEditing] = useState<{ course: string; section?: Section } | null>(null),
    [dragged, setDragged] = useState<{ course: string; section: string } | null>(null);
  const items = chosen(w.courses, w.selectedSections),
    next = w.courses.find((c) => !w.selectedSections[c.id]),
    progress = w.courses.length ? Math.round((items.length / w.courses.length) * 100) : 0,
    filtered = w.courses.filter((c) =>
      `${c.code} ${c.title} ${c.sections.map((s) => s.faculty).join(' ')}`
        .toLowerCase()
        .includes(search.toLowerCase()) || normalizeCourseCode(c.code).includes(normalizeCourseCode(search)),
    );
  return (
    <div className="planner-page">
      <div className="page-title">
        <div>
          <span className="eyebrow">{CATALOG_META.label.toUpperCase()} — {CATALOG_META.program}</span>
          <h1>Course planner.</h1>
          <p>Select sections and build your week.</p>
        </div>
        <button className="button primary" onClick={() => onEditCourse()}>
          <Plus size={16} /> New course
        </button>
      </div>
      <div className="planner-columns">
        <div className="planner-content">
          <section className="progress-panel" aria-label="Selection progress">
            <div className="progress-copy">
              <span className="progress-icon">
                <Check size={18} />
              </span>
              <div>
                <strong>
                  {next ? (
                    <>
                      Up next <span className="course-pill">{next.code}</span>
                    </>
                  ) : (
                    'Your selections are complete.'
                  )}
                </strong>
                <p>
                  {next
                    ? `Choose a section for ${next.title}.`
                    : 'Review your week in Routine. You can change sections anytime.'}
                </p>
              </div>
              <span className="progress-count">
                {items.length}
                <span> / {w.courses.length}</span><small>{summary(w.courses, w.selectedSections).credits} credits</small>
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Courses scheduled"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <i style={{ width: `${progress}%` }} />
            </div>
          </section>
          <div className="planner-toolbar">
            <div className="search">
              <Search size={16} />
              <input
                aria-label="Search courses or faculty"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses or faculty…"
              />
            </div>
            <button
              className={`filter-toggle ${w.hideConflicted ? 'enabled' : ''}`}
              aria-pressed={w.hideConflicted}
              onClick={onHide}
            >
              {w.hideConflicted ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>Hide conflicts</span>
              <i />
            </button>
          </div>
          <div className="course-stack">
            {filtered.map((c, index) => {
              const current = c.sections.find((s) => s.id === w.selectedSections[c.id]),
                sorted = [...c.sections].sort((a, b) => a.preferenceOrder - b.preferenceOrder),
                hidden = sorted.filter(
                  (s) =>
                    s.id !== current?.id &&
                    findConflicts(w.courses, w.selectedSections, c.id, s).length > 0,
                ).length;
              return (
                <article
                  className={`course-card ${current ? 'complete' : ''}`}
                  id={`course-${c.id}`}
                  tabIndex={-1}
                  key={c.id}
                >
                  <header>
                    <span className={`course-marker ${c.color}`}>
                      {current ? (
                        <Check size={15} />
                      ) : (
                        String(w.courses.indexOf(c) + 1).padStart(2, '0')
                      )}
                    </span>
                    <div className="course-heading">
                      <span className="course-code">
                        {c.code}
                        <span className="course-credit">
                          {c.credits ?? 3} credits · {c.kind === 'lab' ? 'Lab' : 'Theory'}
                        </span>
                      </span>
                      <h2>{c.title}</h2>
                    </div>
                    <div className="course-actions">
                      <button className="icon-button" aria-label={`Edit ${c.code}`} onClick={() => onEditCourse(c)}><Pencil size={14} /></button>
                      <CourseMenu course={c} copied={!!copied} onCopy={() => onCopy(c)} onPaste={() => onPaste(c)} onDelete={() => onDeleteCourse(c)} />
                    </div>
                  </header>
                  <div className="course-body">
                    <div className="section-blocks">
                      {sorted.map((s, i) => {
                        const clashes = findConflicts(w.courses, w.selectedSections, c.id, s),
                          picked = current?.id === s.id;
                        if (w.hideConflicted && clashes.length && !picked) return null;
                        return (
                          <div
                            className={`section-block ${picked ? 'selected' : ''} ${clashes.length ? 'conflicted' : ''}`}
                            key={s.id}
                            draggable
                            onDragStart={(e) => {
                              setDragged({ course: c.id, section: s.id });
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', s.id);
                            }}
                            onDragEnd={() => setDragged(null)}
                            onDragOver={(e) => {
                              if (dragged?.course === c.id) e.preventDefault();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (dragged?.course === c.id) {
                                const moved = c.sections.find((x) => x.id === dragged.section);
                                if (moved) onReorder(c, moved, i);
                              }
                              setDragged(null);
                            }}
                          >
                            <button
                              className="section-choice"
                              onClick={() => onPick(c, s)}
                              aria-pressed={picked}
                              aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                              title="Drag to reorder, or use Alt + Up / Down"
                              onKeyDown={(event) => {
                                if (event.altKey && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
                                  event.preventDefault();
                                  onReorder(c, s, i + (event.key === 'ArrowUp' ? -1 : 1));
                                }
                              }}
                            >
                              <span className="section-title">
                                <strong>{label(s)}</strong>
                              </span>
                              <span className="faculty" title={s.faculty}>
                                {s.faculty}
                              </span>
                              {(s.status === 'customized' || s.status === 'if-required') && <span className="tile-status">{s.status === 'customized' ? 'Customized' : 'If required'}</span>}
                              <span className="tile-meetings">
                                {meetingDisplay(s.timeSlots).map((meeting, index) => (
                                  <span key={index}><b>{meeting.days}</b><span>{meeting.time}</span></span>
                                ))}
                              </span>
                            </button>
                            <div className="tile-reorder">
                              <button className="mini-icon" disabled={i === 0} aria-label={`Move ${c.code} section ${label(s)} earlier`} onClick={() => onReorder(c, s, i - 1)}><ChevronLeft size={14} /></button>
                              <button className="mini-icon" disabled={i === sorted.length - 1} aria-label={`Move ${c.code} section ${label(s)} later`} onClick={() => onReorder(c, s, i + 1)}><ChevronRight size={14} /></button>
                            </div>
                            <div className="tile-actions">
                                <button
                                  className="mini-icon"
                                  aria-label={`Edit ${c.code} section ${label(s)}`}
                                  onClick={() => setEditing({ course: c.id, section: s })}
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  className="mini-icon"
                                  aria-label={`Delete ${c.code} section ${label(s)}`}
                                  onClick={() => onDeleteSection(c, s)}
                                >
                                  <X size={13} />
                                </button>
                            </div>
                          </div>
                        );
                      })}
                      <button className="new-section" onClick={() => setEditing({ course: c.id })}>
                        <Plus size={20} />
                        <span>Add section</span>
                      </button>
                    </div>
                    <div className="course-footnote">
                      {hidden > 0 && w.hideConflicted ? <button className="hidden-conflicts" onClick={onHide}>{hidden} conflicting {hidden === 1 ? 'section hidden' : 'sections hidden'} · Show</button> : <span>{c.sections.length} sections available</span>}
                      <span><span className="reorder-desktop">Drag to reorder</span><span className="reorder-touch">Use arrows to reorder</span> · First is preferred</span>
                    </div>
                    {editing?.course === c.id && (
                      <SectionEditor
                        key={editing.section?.id || 'new'}
                        section={editing.section}
                        courseCode={c.code}
                        kind={c.kind}
                        count={c.sections.length}
                        onCancel={() => setEditing(null)}
                        onSave={(s) => {
                          onSection(c, s);
                          setEditing(null);
                        }}
                      />
                    )}
                  </div>
                </article>
              );
            })}
            {!filtered.length && (
              <div className="empty">
                <h2>{w.courses.length ? 'No matching courses.' : 'Start with a course.'}</h2>
                <p>
                  {w.courses.length
                    ? 'Try another course code or faculty name.'
                    : 'Add a course, then give it a few section options.'}
                </p>
                <button className="button" onClick={() => onEditCourse()}>
                  Add course <Plus size={14} />
                </button>
              </div>
            )}
          </div>
          <button className="add-course-row" onClick={() => onEditCourse()}>
            <Plus size={16} /> Add another course
          </button>
        </div>
        <aside className="selection-summary">
          <div className="summary-heading">
            <span className="eyebrow">SELECTED / SECTIONS</span>
            <span>{items.length}</span>
          </div>
          {!items.length ? (
            <div className="summary-empty">
              <div className="empty-lines">
                <i />
                <i />
                <i />
              </div>
              <h3>Nothing selected.</h3>
              <p>Select a section to start building your routine.</p>
            </div>
          ) : (
            <>
              <div className="selection-list">
                {items.map(({ course, section }) => (
                  <div key={course.id}>
                    <button className="selected-course-link" onClick={() => {
                      setSearch('');
                      requestAnimationFrame(() => {
                        const target = document.getElementById(`course-${course.id}`);
                        target?.scrollIntoView({ block: 'start' });
                        target?.focus({ preventScroll: true });
                      });
                    }} aria-label={`Go to ${course.code} section ${label(section)}`}>
                      <span className="selection-card">
                        <span className="selection-card-heading">
                          <span className="selection-course-heading"><span className="selection-card-code">{course.code}</span><span className="selection-card-title">{course.title}</span></span>
                          <span className="selection-section-badge">SEC {label(section)}</span>
                        </span>
                        <span className="selection-card-faculty">{section.faculty}</span>
                        <span className="selection-card-meetings">
                          {meetingDisplay(section.timeSlots, true).map((meeting, index) => (
                          <span className="selection-card-meeting" key={index}>
                            <span className="selection-day-badges">
                              {meeting.days.split(' · ').map((day) => <span key={day}>{day}</span>)}
                            </span>
                            <span className="selection-card-time">{meeting.time}</span>
                            <span className={`selection-card-room ${meeting.room ? '' : 'room-unknown'}`}><MapPin size={13} aria-hidden="true" />Room {meeting.room || 'TBA'}</span>
                          </span>
                          ))}
                        </span>
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          <WeekOccupancy courses={w.courses} selections={w.selectedSections} />
          <div className="selection-footer">
              {items.length > 0 && <div className="selection-total">
                <span>Selected credits</span>
                <strong>{summary(w.courses, w.selectedSections).credits}</strong>
              </div>}
          {items.length > 0 && <p className="selection-clear"><Check size={13} aria-hidden="true" />No time clashes</p>}
          <button className="button primary full" onClick={onRoutine}>
            View routine <ArrowRight size={15} />
          </button>
          <p className="local-note">Changes save automatically on this device.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CourseMenu({ course, copied, onCopy, onPaste, onDelete }: { course: Course; copied: boolean; onCopy: () => void; onPaste: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return <div className="course-menu" ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} className="icon-button" aria-label={`More actions for ${course.code}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}><MoreHorizontal size={16} /></button>
    {open && <div role="menu" aria-label={`${course.code} actions`} onKeyDown={(event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')];
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      }
    }}>
      <button role="menuitem" disabled={!course.sections.length} onClick={() => { close(); onCopy(); }}><Copy size={14} />Copy sections</button>
      <button role="menuitem" disabled={!copied} onClick={() => { close(); onPaste(); }}><Clipboard size={14} />Paste sections</button>
      <button role="menuitem" onClick={() => { close(); onDelete(); }}><Trash2 size={14} />Delete course</button>
    </div>}
  </div>;
}
