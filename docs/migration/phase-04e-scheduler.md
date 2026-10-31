# Phase 4E — Scheduler (first safety/preview slice)

**Stack base:** `migration/phase-04d-tree-mapper`, inheriting pending 4B–4D work.

Added `src/domain/schedule-preview.ts`: deterministic, immutable comparison of generated weeks, explicitly guarding **locked weeks** and estimating remaining planned repeat opportunities without marking Scout records completed. Tests cover changed unlocked weeks, lost/modified locks, duplicates on the same night and required repeat counts.

**Important:** This is not yet a Vue scheduler. The live strategy scoring, 1–60 week generation, location preference, themed night regeneration, same-night prerequisite order, repeat evidence, confirmation, forecast and leader reviews remain the **original code**. Any future migration must compare actual schedules and project forecasts against the legacy implementation, with real workbook import tested privately and no private Scout data uploaded.

Review commands: `npm ci && npm test && npm run dev`. The visible UI should be unchanged from 4D. Keep **Draft / partial** until feature and safety acceptance. Production `main` unchanged.
