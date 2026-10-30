# Phase 4E.3a — Vue themed regeneration and swap interactions

**Stack:** based on 4E.2c / PR #26. The original code in `js/theme-tracker.js` and `js/forecast.js` remains responsible for theme scoring, random versus progression mode, locked-week confirmation, prerequisite-aware warnings, candidate ranking, schedule checkpoints and persistence. This slice restores the existing theme/reroll and swap-similar enhancements *after* Vue has painted the asynchronously updated week cards.

## Contract
- `weeks-mount.ts` waits for Vue's `nextTick` before binding original week handlers and invoking `__oasEnhanceScheduleWeeks`.
- The callback invokes the existing theme-regeneration and similar-skill enhancements, without introducing a competing algorithm or updating Scout achievements.
- Duplicate theme-reroll widgets are prevented when the same card is enhanced twice.
- `?scheduleWeeksRenderer=legacy` remains available; scheduler state and Excel import format are unchanged.

## Acceptance scenarios
1. Set a week theme; verify it is regenerated from matching tagged skills and becomes locked.
2. Unlock; switch mode between progression and random, reroll, and inspect prerequisites. Random is not guaranteed to optimise progression.
3. Verify a locked week asks before regeneration and Cancel preserves all stored fields.
4. Unlock; open Swap similar, Cancel, select a valid replacement, then verify it locks the week and clears stale activity confirmation, not Scout evidence.
5. Toggle location consideration off and compare candidate ranking without venue influence.
6. Regenerate unlocked weeks with some locked weeks and attached activities; confirm locked weeks survive.
7. Compare Vue and legacy at 1440×900 and 390×844; verify repeated render cycles do not duplicate controls.
8. Export full local backup and verify Scout completions, Excel provenance and history fields unchanged.

**Verification:** code committed, build/browser acceptance still to be confirmed. The original Vue week-card migration relies on preserving legacy event bridges; run the full Playwright suite before promoting to a team-facing Pages build.
