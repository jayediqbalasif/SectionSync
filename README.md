# SectionSync

A local-first course planner redesigned from the supplied Course Section Planner export. Two dedicated views: **Planner** and **Routine**. No backend, account, API key, or AI service is required.

## Run locally

Requires Node.js 22.12+ or a supported newer version and npm.

```sh
npm install
npm run dev
```

Open **http://localhost:3000/#/planner**. Use this exact origin for your saved workspace. The previous experimental version cached files on the separate `127.0.0.1` origin; localhost uses this rebuilt project.

```sh
npm test
npm run lint
npm run build
npm run preview
```

`lint` runs TypeScript's type checker. `dist/` contains the deployable static website. Hash routes work on static hosts without server-side routing.

## Planner

- A dedicated course workspace with a guided next-course prompt and progress bar.
- Search by course code, title, or instructor.
- Compact section tiles showing the section and faculty names. Meeting times and priority are managed in the section editor.
- Conflict filtering with hidden-option counts. Showing conflicts lets you replace overlapping selections with an explicit explanation.
- Inline section creation and editing, including multiple meeting days.
- Drag-to-reorder with accessible arrow buttons for keyboard and touch use.
- Course creation/editing, configurable credits and theory/lab labels.
- Copy/paste section options between courses, with confirmation before replacement.
- A selection summary and one-step Undo.

## Routine

- A separate weekly timetable at `#/routine`.
- Automatic weekend display when a selected section meets on Saturday or Sunday.
- Actual credits, campus days, weekly meeting count, and total idle gaps.
- Named plans with notes, independent snapshots, and restore/delete controls.
- Browser Print / Save as PDF with a landscape timetable layout.
- Full JSON backup and restore, including saved plans.

## Browser storage

The app writes a single versioned workspace record to localStorage (`sectionsync.workspace.v2`) containing courses, selected sections, saved plans, conflict-filter state, and update time. Normal refreshes and browser restarts retain it. There is no cross-device sync, collaborative merge, or server database. Use one tab for editing.

Same-origin data from the original app is migrated on first use. Original localStorage keys remain untouched. Invalid stored data is not overwritten automatically. Save failures remain visible; export a backup before closing if browser storage is unavailable or full.

Clearing site data, private browsing, browser eviction, or device loss can remove local work. Download JSON backups from **Storage & backups**. Backups from the original app's `1.0` format and this redesign's `2.0` format are supported. Imports are validated before replacing any data.

The demo course library comes from the supplied ZIP. It is not official university semester data. Older courses do not include credits, so they initially default to 3; edit them to match actual university values. The fabricated syllabus, accreditation statements, mock server status, and misleading efficiency score from the original UI have been removed.

## Project

- `src/App.tsx`: two-page shell, routes, dialogs, and user actions.
- `src/components/PlannerPage.tsx`: guided selector and course/section cards.
- `src/components/SectionEditor.tsx`: validated inline meeting editor.
- `src/components/RoutinePage.tsx`: timetable, schedule details, and saved plans.
- `src/components/Dialog.tsx`: accessible native modal.
- `src/hooks/useWorkspace.ts`: local persistence, migration, and Undo.
- `src/lib/workspace.ts`: validation, backups, conflicts, priorities, and statistics.
- `src/types.ts`: original domain types, extended with editable credit/type fields.
- `tests/workspace.test.ts`: behavior tests using Node's built-in test runner.
- `docs/redesign-plan.md`: product structure and design decisions.

## Folder layout

```text
SectionSync/
├── src/                 Application code and styles
│   ├── components/      Planner, Routine, dialogs, and section editor
│   ├── hooks/           Browser storage and workspace state
│   └── lib/             Schedule validation, conflicts, and backups
├── tests/               Workspace behavior tests
├── docs/                Setup guide and design notes
├── dist/                Generated production build (ignored)
├── node_modules/        Installed dependencies (ignored)
└── README.md            Project overview and quick start
```

Repository: https://github.com/jayediqbalasif/SectionSync

To save future changes after cloning the repository, use a Git client to commit and push to `main`. Installed dependencies, generated build files, and browser workspace data are not part of the repository.
