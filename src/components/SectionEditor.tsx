import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Section, DAYS_OF_WEEK, DayOfWeek, formatTimeTo12h } from '../types';
import { label, validateMeetings } from '../lib/workspace';
import { TIME_PRESETS, DAY_GROUPS } from '../lib/schedulePresets';
import { CatalogSection, offeringsForCourse, sameText } from '../lib/catalog';
import { Dialog } from './Dialog';

type PendingOverride = { body: string; apply: () => void };

function dayValue(offering: CatalogSection, kind: 'theory' | 'lab') {
  if (kind === 'lab') return offering.timeSlots[0]?.day || '';
  const index = DAY_GROUPS.findIndex(
    (group) =>
      group.days.length === offering.timeSlots.length &&
      group.days.every((day) => offering.timeSlots.some((meeting) => meeting.day === day)),
  );
  return index < 0 ? '' : String(index);
}

function slotValue(offering: CatalogSection, kind: 'theory' | 'lab') {
  const index = TIME_PRESETS[kind].findIndex((preset) =>
    offering.timeSlots.every(
      (meeting) => meeting.startTime === preset.startTime && meeting.endTime === preset.endTime,
    ),
  );
  return index < 0 ? '' : String(index);
}

export function SectionEditor({
  section,
  courseCode,
  kind = 'theory',
  onSave,
  onCancel,
  count,
}: {
  section?: Section;
  courseCode: string;
  kind?: 'theory' | 'lab';
  onSave: (s: Section) => void;
  onCancel: () => void;
  count: number;
}) {
  const offerings = useMemo(
    () => offeringsForCourse(courseCode).filter((offering) => offering.kind === kind),
    [courseCode, kind],
  );
  const originalOffering = offerings.find(
    (offering) => offering.catalogOfferingId === section?.catalogOfferingId,
  );
  const [name, setName] = useState(section ? label(section) : ''),
    [faculty, setFaculty] = useState(section?.faculty || ''),
    [priority, setPriority] = useState(section?.preferenceOrder || count + 1),
    [matchedId, setMatchedId] = useState(originalOffering?.catalogOfferingId || ''),
    [days, setDays] = useState(() => {
      if (originalOffering) return dayValue(originalOffering, kind);
      if (!section) return kind === 'lab' ? 'Monday' : '0';
      if (kind === 'lab') return section.timeSlots.length === 1 ? section.timeSlots[0].day : '';
      const index = DAY_GROUPS.findIndex(
        (group) =>
          group.days.length === section.timeSlots.length &&
          group.days.every((day) => section.timeSlots.some((meeting) => meeting.day === day)),
      );
      return index < 0 ? '' : String(index);
    }),
    [slot, setSlot] = useState(() => {
      if (originalOffering) return slotValue(originalOffering, kind);
      if (!section) return '0';
      const index = TIME_PRESETS[kind].findIndex((preset) =>
        section.timeSlots.every(
          (meeting) =>
            meeting.startTime === preset.startTime && meeting.endTime === preset.endTime,
        ),
      );
      return index < 0 ? '' : String(index);
    }),
    [error, setError] = useState(''),
    [pending, setPending] = useState<PendingOverride | null>(null);

  const presets = TIME_PRESETS[kind];
  const matched = offerings.find((offering) => offering.catalogOfferingId === matchedId);
  const officialDays = matched ? dayValue(matched, kind) : '';
  const officialSlot = matched ? slotValue(matched, kind) : '';
  const selectedDays =
    days === ''
      ? []
      : kind === 'lab'
        ? [days as DayOfWeek]
        : DAY_GROUPS[Number(days)]?.days || [];
  const selectedSlot = slot === '' ? undefined : presets[Number(slot)];
  const exactFacultyOfferings = offerings.filter((offering) => sameText(offering.faculty, faculty));
  const sectionOptions = exactFacultyOfferings.length ? exactFacultyOfferings : offerings;
  const exactSectionOfferings = offerings.filter((offering) => sameText(offering.name, name));
  const facultyOptions = exactSectionOfferings.length ? exactSectionOfferings : offerings;
  const uniqueFaculty = [...new Set(facultyOptions.map((offering) => offering.faculty))];

  const applyOffering = (offering: CatalogSection) => {
    setMatchedId(offering.catalogOfferingId);
    setName(offering.name);
    setFaculty(offering.faculty);
    setDays(dayValue(offering, kind));
    setSlot(slotValue(offering, kind));
    setError('');
  };

  const updateSection = (value: string) => {
    setName(value);
    const candidates = offerings.filter((offering) => sameText(offering.name, value));
    const exact = candidates.find((offering) => sameText(offering.faculty, faculty));
    if (exact || candidates.length === 1) applyOffering(exact || candidates[0]);
    else setMatchedId('');
  };

  const updateFaculty = (value: string) => {
    setFaculty(value);
    const candidates = offerings.filter((offering) => sameText(offering.faculty, value));
    const exact = candidates.find((offering) => sameText(offering.name, name));
    if (exact || candidates.length === 1) applyOffering(exact || candidates[0]);
    else {
      setMatchedId('');
      if (candidates.length && !candidates.some((offering) => sameText(offering.name, name))) {
        setName('');
      }
    }
  };

  const chooseRestricted = (type: 'day' | 'time', value: string, apply: () => void) => {
    const officialValue = type === 'day' ? officialDays : officialSlot;
    if (!matched || !officialValue || value === officialValue) {
      apply();
      return;
    }
    setPending({
      body: `${matched.faculty} does not offer ${courseCode} section ${matched.name} at this ${type}. Use it anyway as a custom override?`,
      apply,
    });
  };

  return (
    <>
      <form
        className="inline-editor"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            if (!name.trim()) throw new Error('Enter a section name.');
            if (days === '' || slot === '') throw new Error('Choose class days and a time slot.');
            const preset = presets[Number(slot)];
            const chosenDays = kind === 'lab' ? [days as DayOfWeek] : DAY_GROUPS[Number(days)].days;
            const isOfficialSchedule = !!matched && days === officialDays && slot === officialSlot;
            const meetings = chosenDays.map((day) => {
              const officialMeeting = isOfficialSchedule
                ? matched?.timeSlots.find((meeting) => meeting.day === day)
                : undefined;
              return {
                day,
                startTime: preset.startTime,
                endTime: preset.endTime,
                ...(officialMeeting?.room ? { room: officialMeeting.room } : {}),
              };
            });
            validateMeetings(meetings);
            onSave({
              id: section?.id || matched?.catalogOfferingId || crypto.randomUUID(),
              name: name.trim(),
              faculty: faculty.trim() || 'TBA',
              preferenceOrder: priority,
              timeSlots: meetings,
              ...(matched
                ? {
                    catalogOfferingId: matched.catalogOfferingId,
                    facultyInitial: matched.facultyInitial,
                    sourceSerial: matched.sourceSerial,
                    sourcePage: matched.sourcePage,
                    status: isOfficialSchedule ? matched.status : ('customized' as const),
                    note: matched.note,
                  }
                : {}),
            });
          } catch (caught) {
            setError((caught as Error).message);
          }
        }}
      >
        <div className="inline-heading">
          <h4>{section ? 'Edit section' : 'New section'}</h4>
          <button className="text-button" type="button" onClick={onCancel}>Cancel</button>
        </div>
        <div className="editor-fields">
          <label>
            Section
            <input autoFocus required maxLength={80} placeholder="A or L1" list={`section-options-${courseCode.replace(/\W/g, '-')}`} value={name} onChange={(event) => updateSection(event.target.value)} />
            <datalist id={`section-options-${courseCode.replace(/\W/g, '-')}`}>
              {sectionOptions.map((offering) => <option key={offering.catalogOfferingId} value={offering.name}>{offering.faculty}</option>)}
            </datalist>
          </label>
          <label>
            Faculty
            <input maxLength={150} placeholder="Faculty name" list={`faculty-options-${courseCode.replace(/\W/g, '-')}`} value={faculty} onChange={(event) => updateFaculty(event.target.value)} />
            <datalist id={`faculty-options-${courseCode.replace(/\W/g, '-')}`}>
              {uniqueFaculty.map((facultyName) => <option key={facultyName} value={facultyName} />)}
            </datalist>
          </label>
          <label>
            Priority
            <input type="number" min="1" max={count + (section ? 0 : 1)} required value={priority} onChange={(event) => setPriority(Number(event.target.value))} />
          </label>
        </div>
        <p className={`catalog-match ${matched ? 'matched' : ''}`} aria-live="polite">
          {matched
            ? `Official ${matched.status === 'if-required' ? 'if-required ' : ''}offering · ${matched.faculty}`
            : offerings.length
              ? 'Choose a listed section or faculty for the official schedule, or enter custom details.'
              : 'No catalog offering found for this course. This section will be custom.'}
        </p>
        <div className="schedule-picker">
          <div className="schedule-controls">
            <fieldset className="quick-days">
              <legend>Quick days</legend>
              <div className={kind === 'lab' ? 'day-buttons lab-days' : 'day-buttons'}>
                {kind === 'lab'
                  ? DAYS_OF_WEEK.map((day) => {
                      const restricted = !!matched && !!officialDays && officialDays !== day;
                      return <button key={day} type="button" className={restricted ? 'is-restricted' : ''} aria-disabled={restricted} aria-pressed={days === day} title={restricted ? 'Not offered by this faculty; click to override' : ''} onClick={() => chooseRestricted('day', day, () => setDays(day))}>{day.slice(0, 3)}</button>;
                    })
                  : DAY_GROUPS.map((group, index) => {
                      const value = String(index);
                      const restricted = !!matched && !!officialDays && officialDays !== value;
                      return <button key={group.name} type="button" className={restricted ? 'is-restricted' : ''} aria-disabled={restricted} aria-pressed={days === value} title={restricted ? 'Not offered by this faculty; click to override' : ''} onClick={() => chooseRestricted('day', value, () => setDays(value))}>{group.name}</button>;
                    })}
              </div>
            </fieldset>
            <label className="slot-choice">
              <span className="sr-only">{kind === 'lab' ? 'Lab time slot' : 'Theory time slot'}</span>
              <select required value={slot} onChange={(event) => { const value = event.target.value; chooseRestricted('time', value, () => setSlot(value)); }}>
                <option value="" disabled>Choose a time slot</option>
                {presets.map((preset, index) => {
                  const value = String(index);
                  const restricted = !!matched && !!officialSlot && officialSlot !== value;
                  return <option key={preset.name} value={value}>{preset.name}: {formatTimeTo12h(preset.startTime)}–{formatTimeTo12h(preset.endTime)}{restricted ? ' · not offered' : ''}</option>;
                })}
              </select>
            </label>
          </div>
          <div className="schedule-preview" role="status" aria-live="polite" aria-label="Schedule preview">
            {selectedDays.length > 0 && selectedSlot ? selectedDays.map((day) => (
              <div key={day}><span>{day}</span><span>{formatTimeTo12h(selectedSlot.startTime)}–{formatTimeTo12h(selectedSlot.endTime)}</span></div>
            )) : <p>Choose days and a time slot to preview your schedule.</p>}
          </div>
        </div>
        {error && <p role="alert" className="error-text">{error}</p>}
        <div className="editor-footer">
          <span>Priority 1 is your first choice.</span>
          <button type="submit" className="button primary">{section ? 'Save section' : 'Add section'} <Plus size={14} /></button>
        </div>
      </form>
      {pending && (
        <Dialog title="Use an unofficial schedule?" onClose={() => setPending(null)}>
          <p className="muted">{pending.body}</p>
          <div className="dialog-actions">
            <button className="button" type="button" onClick={() => setPending(null)}>Keep official schedule</button>
            <button className="button primary" type="button" onClick={() => { pending.apply(); setPending(null); }}>Use anyway</button>
          </div>
        </Dialog>
      )}
    </>
  );
}
