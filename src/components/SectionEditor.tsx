import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Section, DAYS_OF_WEEK, TimeSlot } from '../types';
import { label, validateMeetings } from '../lib/workspace';
export function SectionEditor({
  section,
  onSave,
  onCancel,
  count,
}: {
  section?: Section;
  onSave: (s: Section) => void;
  onCancel: () => void;
  count: number;
}) {
  const [name, setName] = useState(section ? label(section) : ''),
    [faculty, setFaculty] = useState(section?.faculty || ''),
    [priority, setPriority] = useState(section?.preferenceOrder || count + 1),
    [meetings, setMeetings] = useState<TimeSlot[]>(
      section
        ? structuredClone(section.timeSlots)
        : [{ day: 'Monday', startTime: '09:00', endTime: '10:30' }],
    ),
    [error, setError] = useState('');
  const edit = (i: number, key: keyof TimeSlot, value: string) =>
    setMeetings((rows) => rows.map((m, j) => (i === j ? { ...m, [key]: value } : m)));
  return (
    <form
      className="inline-editor"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          if (!name.trim()) throw new Error('Enter a section name.');
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
      <div className="meeting-label">
        <span>Weekly meetings</span>
        <button
          type="button"
          className="text-button"
          onClick={() =>
            setMeetings([
              ...meetings,
              {
                ...meetings[meetings.length - 1],
                day: DAYS_OF_WEEK[
                  (DAYS_OF_WEEK.indexOf(meetings[meetings.length - 1].day) + 1) % 7
                ],
              },
            ])
          }
        >
          <Plus size={13} /> Add day
        </button>
      </div>
      {meetings.map((m, i) => (
        <div className="meeting-fields" key={i}>
          <label>
            Day
            <select value={m.day} onChange={(e) => edit(i, 'day', e.target.value)}>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            From
            <input
              required
              type="time"
              value={m.startTime}
              onChange={(e) => edit(i, 'startTime', e.target.value)}
            />
          </label>
          <label>
            Until
            <input
              required
              type="time"
              value={m.endTime}
              onChange={(e) => edit(i, 'endTime', e.target.value)}
            />
          </label>
          <button
            type="button"
            className="icon-button"
            aria-label="Remove meeting"
            disabled={meetings.length === 1}
            onClick={() => setMeetings(meetings.filter((_, j) => j !== i))}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
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
