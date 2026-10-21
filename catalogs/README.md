# Trimester catalogs

SectionSync keeps each official trimester catalog as generated JSON under
`src/data/catalogs/`. The browser reads that JSON directly, so the planner stays
fully local and does not need a backend.

## Import another routine

1. Put the university routine PDF anywhere on the computer. Raw PDFs are not
   committed to the public repository.
2. If the bundled Codex Python runtime is unavailable, install the importer
   dependencies with `python3 -m pip install -r scripts/catalog/requirements.txt`.
3. Run the importer from the project root:

   ```sh
   npm run catalog:import -- "/path/to/routine.pdf" \
     --program BSCSE \
     --term Fall \
     --year 2026 \
     --output src/data/catalogs/fall-2026-bscse.json \
     --report catalogs/reports/fall-2026-bscse.validation.json
   ```

4. Review the generated validation report. It records row, course, section and
   serial totals, plus TBA and if-required offerings that need attention.
5. Update `src/lib/catalog.ts` to import the new active catalog, then run
   `npm test`, `npm run lint`, and `npm run build`.

The importer validates continuous source serials and keeps source page/serial
references on every offering. This makes questionable entries traceable to the
original PDF. It detects lab-style offerings from their single long weekly
meeting and stores room, faculty, section, day and time data separately.
