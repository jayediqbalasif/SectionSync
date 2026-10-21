import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Section, DAYS_OF_WEEK, formatTimeTo12h } from '../types';
import { label, validateMeetings } from '../lib/workspace';
import { TIME_PRESETS, DAY_GROUPS } from '../lib/schedulePresets';
export function SectionEditor({
  section,
  kind = 'theory',
  onSave,
  onCancel,
  count,
}: {
  section?: Section;
  kind?: 'theory' | 'lab';
  onSave: (s: Section) => void;
  onCancel: () => void;
  count: number;
}) {
  const [name, setName] = useState(section ? label(section) : ''),
    [faculty, setFaculty] = useState(section?.faculty || ''),
    [priority, setPriority] = useState(section?.preferenceOrder || count + 1),
    [days, setDays] = useState(() => {
      if (!section) return kind === 'lab' ? 'Monday' : '0';
      if (kind === 'lab') return section.timeSlots.length === 1 ? section.timeSlots[0].day : '';
      const index = DAY_GROUPS.findIndex(
        (group) =>
          group.days.length === section.timeSlots.length &&
          group.days.every((day) => section.timeSlots.some((m) => m.day === day)),
      );
      return index < 0 ? '' : String(index);
    }),
    [slot, setSlot] = useState(() => {
      if (!section) return '0';
      const index = TIME_PRESETS[kind].findIndex((preset) =>
        section.timeSlots.every(
          (m) => m.startTime === preset.startTime && m.endTime === preset.endTime,
        ),
      );
      return index < 0 ? '' : String(index);
    }),
    [error, setError] = useState('');
  const presets = TIME_PRESETS[kind];
  const selectedDays =
    days === ''
      ? []
      : kind === 'lab'
        ? [days as (typeof DAYS_OF_WEEK)[number]]
        : DAY_GROUPS[Number(days)].days;
  const selectedSlot = slot === '' ? undefined : presets[Number(slot)];
  return (
    <form
      className="inline-editor"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          if (!name.trim()) throw new Error('Enter a section name.');
          if (days === '' || slot === '') throw new Error('Choose class days and a time slot.');
          const preset = presets[Number(slot)];
          const selectedDays =
            kind === 'lab'
              ? [days as (typeof DAYS_OF_WEEK)[number]]
              : DAY_GROUPS[Number(days)].days;
          const meetings = selectedDays.map((day) => ({
            day,
            startTime: preset.startTime,
            endTime: preset.endTime,
          }));
          validateMeetings(meetings);
          onSave({
            id: section?.id || crypto.randomUUID(),
            name: name.trim(),
            faculty: faculty.trim() || 'TBA',
            preferenceOrder: priority,
            timeSlots: meetings,
          });
        } catch (e) {
          setError((e as Error).message);
        }
      }}
    >
      <div className="inline-heading">
        <h4>{section ? 'Edit section' : 'New section'}</h4>
        <button className="text-button" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <div className="editor-fields">
        <label>
          Section
          <input
            autoFocus
            required
            maxLength={80}
            placeholder="A or L1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Instructor
          <input
            maxLength={150}
            placeholder="Instructor name"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
          />
        </label>
        <label>
          Priority
          <input
            type="number"
            min="1"
            max={count + (section ? 0 : 1)}
            required
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="schedule-picker">
        <div className="schedule-controls">
          <fieldset className="quick-days">
            <legend>Quick days</legend>
            <div className={kind === 'lab' ? 'day-buttons lab-days' : 'day-buttons'}>
              {kind === 'lab'
                ? DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={days === day}
                      onClick={() => setDays(day)}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))
                : DAY_GROUPS.map((group, index) => (
                    <button
                      key={group.name}
                      type="button"
                      aria-pressed={days === String(index)}
                      onClick={() => setDays(String(index))}
                    >
                      {group.name}
                    </button>
                  ))}
            </div>
          </fieldset>
          <label className="slot-choice">
            <span className="sr-only">{kind === 'lab' ? 'Lab time slot' : 'Theory time slot'}</span>
            <select required value={slot} onChange={(e) => setSlot(e.target.value)}>
              <option value="" disabled>
                Choose a time slot
              </option>
              {presets.map((preset, index) => (
                <option key={preset.name} value={index}>
                  {preset.name}: {formatTimeTo12h(preset.startTime)}–
                  {formatTimeTo12h(preset.endTime)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="schedule-preview"
          role="status"
          aria-live="polite"
          aria-label="Schedule preview"
        >
          {selectedDays.length > 0 && selectedSlot ? (
            selectedDays.map((day) => (
              <div key={day}>
                <span>{day}</span>
                <span>
                  {formatTimeTo12h(selectedSlot.startTime)}–{formatTimeTo12h(selectedSlot.endTime)}
                </span>
              </div>
            ))
          ) : (
            <p>Choose days and a time slot to preview your schedule.</p>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <div className="editor-footer">
        <span>Priority 1 is your first choice.</span>
        <button type="submit" className="button primary">
          {section ? 'Save section' : 'Add section'} <Plus size={14} />
        </button>
      </div>
    </form>
  );
}
