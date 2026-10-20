import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Download,
  Printer,
  Trash2,
  Check,
  Plus,
} from 'lucide-react';
import {
  Course,
  Section,
  SavedPlan,
  DAYS_OF_WEEK,
  parseTimeToMinutes,
  formatTimeTo12h,
} from '../types';
import { Workspace, chosen, label, summary } from '../lib/workspace';
export function RoutinePage({
  workspace: w,
  onPlanner,
  onSave,
  onLoad,
  onDelete,
  onExport,
  onPrint,
}: {
  workspace: Workspace;
  onPlanner: () => void;
  onSave: () => void;
  onLoad: (p: SavedPlan) => void;
  onDelete: (p: SavedPlan) => void;
  onExport: () => void;
  onPrint: () => void;
}) {
  const [tab, setTab] = useState<'week' | 'saved'>('week');
  const items = chosen(w.courses, w.selectedSections),
    stats = summary(w.courses, w.selectedSections);
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">§ 02 — WEEKLY ROUTINE</span>
          <h1>Your routine.</h1>
          <p>
            {items.length
              ? `${items.length} courses · ${stats.credits} credits · ${stats.days} campus ${stats.days === 1 ? 'day' : 'days'}`
              : 'Your chosen sections will appear here.'}
          </p>
        </div>
        <button className="button primary" onClick={onSave}>
          <Bookmark size={15} /> Save a plan
        </button>
      </div>
      <div className="routine-navigation">
        <div role="tablist" aria-label="Routine views">
          <button role="tab" aria-selected={tab === 'week'} onClick={() => setTab('week')}>
            Weekly routine
          </button>
          <button role="tab" aria-selected={tab === 'saved'} onClick={() => setTab('saved')}>
            Saved plans <span>{w.savedPlans.length}</span>
          </button>
        </div>
        <div className="row">
          <button className="text-button export-backup" onClick={onExport}>
            <Download size={14} /> Backup
          </button>
          <button className="text-button" onClick={onPlanner}>
            <ArrowLeft size={14} /> Back to planner
          </button>
          {tab === 'week' && (
            <button className="button small" disabled={!items.length} onClick={onPrint}>
              <Printer size={14} /> Print / PDF
            </button>
          )}
        </div>
      </div>
      {tab === 'week' ? (
        <>
          <div className="routine-meta">
            <div>
              <span className="status-dot" />
              {items.length ? 'No overlapping sections' : 'No sections selected'}
            </div>
            <span>
              {stats.meetings} weekly meetings <b>·</b>{' '}
              {stats.gap
                ? `${Math.floor(stats.gap / 60)}h ${stats.gap % 60}m between classes`
                : 'No gaps between classes'}
            </span>
          </div>
          <div className="print-heading">
            <h1>SectionSync</h1>
            <p>Weekly class routine · {stats.credits} credits</p>
          </div>
          <WeekCalendar courses={w.courses} selections={w.selectedSections} />
          {items.length ? (
            <section className="routine-course-list">
              <div className="section-title-line">
                <h2>Course details</h2>
                <span>{items.length} selected sections</span>
              </div>
              {items.map(({ course, section }) => (
                <div className="routine-course-row" key={course.id}>
                  <i className={`selection-dot ${course.color}`} />
                  <strong>{course.code}</strong>
                  <span>{course.title}</span>
                  <span>Section {label(section)}</span>
                  <span>{section.faculty}</span>
                  <span>{course.credits ?? 3} cr</span>
                </div>
              ))}
            </section>
          ) : (
            <div className="empty compact">
              <p>Choose your first section in Planner to fill this week.</p>
              <button className="button" onClick={onPlanner}>
                Choose sections <ArrowUpRight size={14} />
              </button>
            </div>
          )}
        </>
      ) : w.savedPlans.length ? (
        <div className="saved-grid">
          {w.savedPlans.map((p) => {
            const stats = summary(p.courses, p.selectedSections);
            return (
              <article className="saved-card" key={p.id}>
                <div className="row between">
                  <span className="eyebrow">
                    {new Date(p.savedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    className="icon-button"
                    aria-label={`Delete plan ${p.name}`}
                    onClick={() => onDelete(p)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <h2>{p.name}</h2>
                <p>{p.note || 'A saved copy of your courses and selections.'}</p>
                <div className="plan-stats">
                  <span>
                    <strong>{stats.count}</strong> courses
                  </span>
                  <span>
                    <strong>{stats.credits}</strong> credits
                  </span>
                  <span>
                    <strong>{stats.days}</strong> days
                  </span>
                </div>
                <div className="plan-tags">
                  {chosen(p.courses, p.selectedSections).map((x) => (
                    <span key={x.course.id}>
                      {x.course.code} · {label(x.section)}
                    </span>
                  ))}
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    onLoad(p);
                    setTab('week');
                  }}
                >
                  Open plan <ArrowUpRight size={14} />
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <Bookmark size={27} strokeWidth={1.4} />
          <h2>Keep a few options.</h2>
          <p>Save this routine as a plan before trying different sections.</p>
          <button className="button" onClick={onSave}>
            Save your first plan <Plus size={14} />
          </button>
        </div>
      )}
    </>
  );
}
const COLORS: Record<string, { bg: string; ink: string; edge: string }> = {
  indigo: { bg: '#f4f4f2', ink: '#171717', edge: '#939393' },
  blue: { bg: '#f4f4f2', ink: '#171717', edge: '#939393' },
  emerald: { bg: '#f4f4f2', ink: '#171717', edge: '#939393' },
  amber: { bg: '#f4f4f2', ink: '#171717', edge: '#939393' },
  rose: { bg: '#f4f4f2', ink: '#171717', edge: '#939393' },
  purple: { bg: '#f4f4f2', ink: '#171717', edge: '#939393' },
  teal: { bg: '#f4f4f2', ink: '#171717', edge: '#939393' },
  sky: { bg: '#f4f4f2', ink: '#171717', edge: '#939393' },
};
export function WeekCalendar({
  courses,
  selections,
}: {
  courses: Course[];
  selections: Record<string, string>;
}) {
  const items = chosen(courses, selections),
    meetings = items.flatMap((x) => x.section.timeSlots),
    days = DAYS_OF_WEEK.filter((d, i) => i < 5 || meetings.some((m) => m.day === d)),
    start =
      Math.min(8, ...meetings.map((m) => Math.floor(parseTimeToMinutes(m.startTime) / 60))) * 60,
    end = Math.max(18, ...meetings.map((m) => Math.ceil(parseTimeToMinutes(m.endTime) / 60))) * 60,
    height = (end - start) * 0.9;
  return (
    <div className="week-calendar">
      <div className="calendar-scroll">
        <div className="calendar-inner" style={{ minWidth: days.length * 120 + 58 }}>
          <div
            className="calendar-days"
            style={{ gridTemplateColumns: `58px repeat(${days.length},1fr)` }}
          >
            <span>TIME</span>
            {days.map((d) => (
              <span key={d}>
                {d}
                <small>{meetings.filter((m) => m.day === d).length || '—'}</small>
              </span>
            ))}
          </div>
          <div
            className="calendar-grid"
            style={{ height, gridTemplateColumns: `58px repeat(${days.length},1fr)` }}
          >
            <div className="hours">
              {Array.from({ length: (end - start) / 60 + 1 }, (_, i) => (
                <span key={i} style={{ top: i * 54 }}>
                  {(start / 60 + i) % 12 || 12}
                  <small>{start / 60 + i < 12 ? 'am' : 'pm'}</small>
                </span>
              ))}
            </div>
            {days.map((day) => (
              <div className="calendar-day" key={day}>
                {Array.from({ length: (end - start) / 60 }, (_, i) => (
                  <div className="hour-rule" key={i} style={{ top: i * 54 }} />
                ))}
                {items.flatMap(({ course, section }) =>
                  section.timeSlots
                    .filter((m) => m.day === day)
                    .map((m, i) => {
                      const color = COLORS[course.color] || COLORS.indigo;
                      return (
                        <div
                          className="calendar-event"
                          key={section.id + i}
                          style={{
                            top: (parseTimeToMinutes(m.startTime) - start) * 0.9,
                            height:
                              (parseTimeToMinutes(m.endTime) - parseTimeToMinutes(m.startTime)) *
                                0.9 -
                              3,
                            background: color.bg,
                            color: color.ink,
                            borderColor: color.edge,
                          }}
                        >
                          <strong>{course.code}</strong>
                          <span>
                            {formatTimeTo12h(m.startTime).replace(/^0/, '')} –{' '}
                            {formatTimeTo12h(m.endTime).replace(/^0/, '')}
                          </span>
                          <small>Section {label(section)}</small>
                        </div>
                      );
                    }),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {!items.length && (
        <div className="calendar-empty-label">
          <CalendarDays size={25} strokeWidth={1.2} />
          <strong>Your week is open.</strong>
          <span>Start by choosing a section in Planner.</span>
        </div>
      )}
    </div>
  );
}
