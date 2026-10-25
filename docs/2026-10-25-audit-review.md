# Audit and review — 25 October 2026

## Resolution update

The findings below record the original audit. Room type validation, saved schedule preservation, automatic-write protection during recovery, PDF parser regression tests, and obsolete tile-action CSS cleanup have since been implemented. No custom room input was added, as requested. Existing saved rooms are retained for edits that leave the schedule unchanged. Mobile Routine has a day agenda; code lookup accepts missing spaces; the Home CTA, FAQ and trimester context were updated. The current verification includes 24 JavaScript tests, 3 Python importer tests, TypeScript, the production build, and browser checks for legacy edits, official autofill, overrides, reopening/saving, and persistence after refresh. Physical mobile devices and print pagination remain unverified.

## Repository audit

What this repo does: SectionSync is a browser-only course planner. It stores courses, selected sections and saved plans on the current device, and imports/exports JSON backups. The expected load is one person editing in one browser tab; there is no shared server state.

### Must fix

1. **A malformed room value can crash the planner** (`src/lib/workspace.ts:68`)
   - **What this is:** Backup validation checks each meeting before the app accepts it.
   - **Problem:** It accepts an object as `room`, such as `{bad: true}`. The selected summary and Routine render `room` as a React child, which throws for objects. A direct validation call reproduced the accepted invalid value.
   - **Fix:** Reject a present `room` unless it is a string. Add one backup-validation regression test.
   - **If we skip it:** An imported malformed backup can leave the saved workspace unable to render until the user recovers or replaces it.

2. **Editing an overridden schedule restores its official time** (`src/components/SectionEditor.tsx:56`)
   - **What this is:** An official offering can be saved with a deliberately customized day or time.
   - **Problem:** When reopening that section, the editor initializes days and time from `originalOffering` before reading the saved section. Saving a faculty or priority edit then also replaces the customized schedule.
   - **Fix:** Initialize the editor from the saved section when editing; retain the official offering only as the restriction reference. Test reopening a customized offering.
   - **If we skip it:** A harmless edit can silently change the user's planned class times.

### Should fix

3. **PDF recovery rules lack automated regression checks** (`scripts/catalog/import_pdf.py:121`)
   - **What this is:** The importer repairs faculty names and initials that cross PDF table borders.
   - **Problem:** Existing catalog tests inspect the generated JSON rather than executing the extraction rules. Removing the lowercase surname-overflow repair would truncate “Khondaker” again without failing those tests until the catalog is regenerated.
   - **Fix:** Add a small Python test for raw row tails with overflowed faculty names, repeated faculty text and credit recovery.
   - **If we skip it:** Future importer edits can generate incorrect names while the existing application tests still pass.

Verdict: Fix 1 and 2 first. These are existing functional issues, not introduced by the tile redesign.

Not checked: A new end-to-end extraction of all 54 PDF pages, real mobile hardware, print pagination, dependency vulnerability scanning, concurrent editing across tabs, or production hosting. Catalog structures, persistence, backups, conflicts, history, forms, routes, calendar, main configuration and tests were inspected. The PDF recovery code was inspected around its repair and reporting paths, not re-audited line by line.

## Change review

What this change does: Section tiles now have a neutral identity area and a meeting strip. Only selected tiles receive one of seven course gradients. Matching-time meetings are grouped, and the four page headings share one top offset and typography scale.

Looks good. Ship.

Checked: The 19 automated tests, TypeScript check and production build pass. The new meeting-grouping test covers paired days, a different Friday time, and empty input. Browser measurements confirm equal title top positions and font sizes on all four pages at the inspected desktop viewport. Course palette selection uses the full course list, so filtering does not change a course's color. Existing selection, conflict and persistence behavior is unchanged.

Limits: Seven palettes repeat after course seven. Removing an earlier course shifts later palette assignments because colors follow library order. The wider tiles are intentional to fit the supplied reference and readable meeting text. Real mobile devices and print pagination were not checked.

## Resolution update — 25 October 2026

Implemented the supplied fix brief with the existing square visual identity and storage format preserved.

| Items | Resolution |
| --- | --- |
| A1 | Skip link prevents hash navigation and focuses main. Browser checked on Planner. |
| A2 | Touch-only earlier/later arrows call the existing reorder action; ends disable. Desktop drag and Alt+Arrow remain. Real touch hardware not checked. |
| A3 | Editing a selected section into a clash names the other course and explains deselection. Reproduced with MAT 112 overlapping CSE 101, then undone. |
| B1 | Local load sanitizes stale/overlapping active selections with a nonblocking removal count. Imports and saved plans remain strict; corrupt courses retain recovery protection. Regression tests added. |
| B2 | Storage events show a Reload workspace notice; reload resets undo/redo. Verified between two browser tabs. |
| B3 | Catalog is dynamically imported only by the course dialog/section editor. Course-code autofill verified in browser. App chunk 66.85 KB, shared vendor 235.17 KB, catalog 288.74 KB. Initial app + vendor is about 302 KB, down from the former 582 KB combined bundle; splitting vendor is caching, not an additional payload saving. |
| B4 | Font declarations have an 11px minimum. Readability tokens darkened, hardcoded weak grays replaced, selected dark tiles fixed. Tests verify normal/muted/subtle text against all five primary surfaces and solid primary-button contrast in both themes. Gradient actions have a subtle dark overlay for readable white text. This is not a complete audit of every composited/animated pixel. |
| B5 | Coarse-pointer icon hit areas expand to at least 40px; tile edit/delete and reorder controls use actual 40px boxes. Device emulation and real touch testing remain unchecked. |
| B6 | Decorative nav indices hidden from assistive technology; document titles and heading focus follow routes. Routine tabs have linked panels, roving tabindex and Arrow/Home/End support. Keyboard behavior verified. |
| B7 | Canonical, Open Graph and Twitter card metadata added with a 1200×630 public/og.png. Built files checked. External link-preview caches require deployment before verification. |
| C1 | Edit remains visible; Copy/Paste/Delete are in a keyboard-accessible overflow menu. Escape, End and focus return verified. |
| C2 | Planner eyebrow shows catalog/trimester; Routine eyebrow shows course and credit counts. Home shows active catalog and live occupancy preview. |
| C3 | Hidden-conflict count is a Show button tied to the same toolbar filter state. |
| C4 | Routine status now shows earliest start, latest finish and free weekdays; tested with empty and occupied schedules. |
| C5 | Summary footer has prominent credits, No time clashes confirmation and solid accessible primary action. |
| C6 | Removed 82 superseded CSS declarations while keeping selector context and cascade order. Merged repeated print blocks and removed empty media blocks. Responsive component variants remain separate intentionally. Full before/after pixel-identical screenshot matrix was not performed; do not treat C6's visual acceptance as certified. |

Additional requested changes: Routine retains all seven days (including empty Sunday) in its calendar and mobile agenda. Selected summaries place code and title together. A text-free seven-day occupancy map beneath the selections shows proportional class positions and durations; its accessible name explains the map.

Validation: 30 automated tests pass; TypeScript and production build pass. Browser checks covered Planner in light/dark, 375px Planner layout through a narrow iframe, skip link, route focus, catalog autofill, overflow keyboard controls, a named conflict edit, multi-tab reload and Routine keyboard tabs/Sunday. Test workspace changes were undone. No catalog JSON or importer changes were made for this brief; preexisting changes remain intact.

Limits: no real phone/coarse-pointer emulation, screen-reader session, full route/theme/viewport screenshot comparison, print pagination, or deployed link-preview validation. Checks were run in batches rather than after each individual item; changes were not split into one commit per brief item because the working tree already contained related uncommitted work. Nothing was pushed or deployed by this update.
