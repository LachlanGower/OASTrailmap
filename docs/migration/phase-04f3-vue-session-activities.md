# Phase 4F.3 — Multi-activity weekly session controls

Stacked on draft PR #32. Existing `multiActivitiesFor`, `multiSchedulePanel` and `multiEnhanceSchedule` in `js/next-phase.js` retain activity eligibility, coverage matching, minutes and venue warnings, order, remove, suggest and confirmation rules. The Vue week renderer calls their enhancer after `nextTick` so controls survive asynchronous redraws. A repeated enhancement cannot duplicate the session panel.

**User interactions:** add/remove/reorder confirmed Activity Studio items; adjust 15–600-minute session window; refresh suggestion; inspect confirmed coverage versus outstanding planned requirements; confirm even when duration or venue warnings require leader acknowledgement.

**Data safety:** planning/confirmation must never award Scout evidence; original localStorage structures remain unchanged. Coverage suggestions are not evidence and never become confirmed automatically. Existing legacy renderer fallback `?scheduleWeeksRenderer=legacy` remains available.

## Test requirements

`tests/e2e/multi-session-parity.cjs` compares Vue and legacy at desktop/mobile sizes using fictional activities and Scout data, verifies single panel, add, confirm, ordered IDs and unmodified Scout records. The 4F.3 GitHub Actions workflow runs npm tests, Vite build, compiled-site verification and this Playwright suite against both Vite and static dist.

Further manual review: over-capacity warning Cancel and Accept, mismatched venues, duplicate activities, unlocked/locked weeks, 1/40/60 weeks, activity coverage consistency and persisted order after reload. Actual private Cub Pack Excel files are never committed.

**Signoff:** Leave draft and do not modify `main`; inspect live CI before claiming acceptance.
