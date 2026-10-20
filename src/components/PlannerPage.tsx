import { useState } from 'react';
import {
  Plus,
  Search,
  Check,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Copy,
  Clipboard,
  Eye,
  EyeOff,
  GripVertical,
  ChevronRight,
} from 'lucide-react';
import { Course, Section } from '../types';
import { Workspace, chosen, findConflicts, label, summary } from '../lib/workspace';
import { SectionEditor } from './SectionEditor';
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
        .includes(search.toLowerCase()),
    );
  return (
    <div className="planner-page">
      <div className="page-title">
        <div>
          <span className="eyebrow">§ 01 — COURSE PLANNER</span>
          <h1>Course planner.</h1>
          <p>Select sections. Resolve overlaps. Build your week.</p>
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
                <span> / {w.courses.length}</span>
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
                aria-label="Search courses or instructors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses or instructors…"
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
                      <button
                        className="icon-button"
                        aria-label={`Copy sections from ${c.code}`}
                        disabled={!c.sections.length}
                        onClick={() => onCopy(c)}
                      >
                        <Copy size={14} />
                      </button>
                      {copied && (
                        <button
                          className="icon-button"
                          aria-label={`Paste sections into ${c.code}`}
                          onClick={() => onPaste(c)}
                        >
                          <Clipboard size={14} />
                        </button>
                      )}
                      <button
                        className="icon-button"
                        aria-label={`Edit ${c.code}`}
                        onClick={() => onEditCourse(c)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete ${c.code}`}
                        onClick={() => onDeleteCourse(c)}
                      >
                        <Trash2 size={14} />
                      </button>
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
                            >
                              <span className="section-title">
                                <strong>{label(s)}</strong>
                              </span>
                              <span className="instructor" title={s.faculty}>
                                {s.faculty}
                              </span>
                            </button>
                            <div className="section-utilities">
                              <GripVertical size={12} aria-hidden />
                              <div>
                                <button
                                  className="mini-icon"
                                  aria-label={`Move ${c.code} section ${label(s)} earlier`}
                                  disabled={i === 0}
                                  onClick={() => onReorder(c, s, i - 1)}
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  className="mini-icon"
                                  aria-label={`Move ${c.code} section ${label(s)} later`}
                                  disabled={i === sorted.length - 1}
                                  onClick={() => onReorder(c, s, i + 1)}
                                >
                                  <ArrowDown size={12} />
                                </button>
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
                                  <Trash2 size={12} />
                                </button>
                              </div>
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
                      <span>
                        {hidden && w.hideConflicted
                          ? `${hidden} conflicting ${hidden === 1 ? 'section hidden' : 'sections hidden'}`
                          : `${c.sections.length} sections available`}
                      </span>
                      <span>Drag to reorder · First is preferred</span>
                    </div>
                    {editing?.course === c.id && (
                      <SectionEditor
                        key={editing.section?.id || 'new'}
                        section={editing.section}
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
                    ? 'Try another course code or instructor.'
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
                    <i className={`selection-dot ${course.color}`} />
                    <div>
                      <strong>
                        {course.code}
                        <span>{label(section)}</span>
                      </strong>
                      <p>{section.faculty}</p>
                      <small>{section.timeSlots.map((m) => m.day.slice(0, 3)).join(' · ')}</small>
                    </div>
                    <Check size={13} />
                  </div>
                ))}
              </div>
              <div className="selection-total">
                <span>Selected credits</span>
                <strong>{summary(w.courses, w.selectedSections).credits}</strong>
              </div>
            </>
          )}
          <button className="button primary full" onClick={onRoutine}>
            View routine <ArrowRight size={15} />
          </button>
          <p className="local-note">Changes save automatically on this device.</p>
        </aside>
      </div>
    </div>
  );
}
