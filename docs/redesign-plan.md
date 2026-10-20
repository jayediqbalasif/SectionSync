# SectionSync redesign

## Product plan

1. Separate planning decisions from timetable review.
2. Make Planner a complete section-selection workspace rather than a sidebar next to a calendar.
3. Make Routine the single destination for weekly schedules, saved plans, and printing.
4. Preserve useful original behaviors: sequential guidance, conflict pruning, course/section creation, priority changes, copy/paste, local saves, and portable backups.
5. Remove misleading content: fake server connection status, fabricated course syllabi/accreditation, and an efficiency percentage unrelated to actual schedule gaps.
6. Verify the new routes, editing, selection, persistence, saved plans, and responsive layout.

## Information architecture

Sidebar contains exactly two primary destinations:

- **Planner** (`#/planner`): course library, progress, search, section options, inline editors, and selection summary.
- **Routine** (`#/routine`): weekly routine and saved-plan tabs, schedule statistics, backup export, and Print / PDF.

Storage help and import are secondary sidebar actions. Course-specific actions live beside their course. Section-specific editing and priorities live on the section card. Destructive actions use confirmations and support Undo.

## Visual direction

The latest direction follows the visual principles of the user-supplied ITSUA reference (https://itsua.com/): a white canvas, oversized black sans-serif headings, compact monospace labels, bracketed navigation numbers, thin rules, square controls, faint grid guides, and a restrained electric-blue accent. Rounded cards, soft panel backgrounds, shadows, and pastel calendar blocks have been removed. Section options use flat framed blocks, and selected options use a black border with a narrow blue edge. Calendar events use quiet neutral fills.

The reference informs typography and composition; all application content and course-planning functionality remain SectionSync's. Planner and Routine remain dedicated pages. Mobile navigation uses the same monochrome direction, and the weekly grid scrolls within its own container.

## State architecture

A single React workspace hook owns the domain state. Mutations clone and validate the next state before rendering it. An effect persists changed workspaces, and storage errors are reported honestly. Undo restores the previous workspace. Save/restore actions retain full course snapshots so saved plans remain independent of later library edits.

The versioned localStorage record is atomic for this small local app and compatible with the original export. No server or additional database dependency is introduced. There is no cross-tab synchronization; editing in one tab is recommended.

Core domain helpers are separate from React and covered by behavior tests: meeting validation, overlap boundaries, selected-section references, priority reordering, credits, gap statistics, and backup compatibility.

## Verification

- Node behavior tests: `npm test`.
- TypeScript: `npm run lint`.
- Production build: `npm run build`.
- Browser walkthrough: choose three compatible sections, confirm conflict hiding and progress, switch to Routine, save a named plan, reload, and inspect Saved plans.
- Mobile walkthrough at 390 × 844: drawer layout, section cards, inline section creation, and Undo.

The original ZIP and earlier backed-up implementation remain available for comparison and recovery. This redesign does not add automated combination generation, an account system, cloud synchronization, or an offline service worker; it concentrates on the supplied base application's workflows.
