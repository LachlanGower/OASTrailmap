# Phase 4H — Vue Help & Design (visible island; cleanup deferred)

**Stack base:** `migration/phase-04g-data-state`. This branch is a combined preview of the unmerged 4B–4G stack.

## Implemented

- Vue handles the Help & Design search input, topic list and selected article. The original public `HELP_TOPICS` content is exposed (without Scout data) **after** both `docs-upgrade.js` and the asynchronous theme/tracker initializer finish revising and adding topics, so legacy and Vue see the same 15 entries.
- The article's diagram and text formatting are produced by the **original** `docsDiagram` and `docsFormat` functions. All content is reference/help copy, not user-generated HTML. No progress storage is read or modified.
- The existing `showHelp()` handles overall workspace switching, while the legacy `helpRender()` is silent once Vue is active.
- `?helpRenderer=legacy` preserves the original Help view. Vue mount failure also leaves the old UI intact.

## Review

```sh
npm ci
npm test
npm run dev
```

Open http://localhost:5173/ and compare with http://localhost:5173/?helpRenderer=legacy. Select Help & Design, search Excel, repeat, forecasts and an unmatched term; open a topic, clear search and navigate away/back. Compare desktop and mobile. All other sensitive workspaces remain legacy.

## Acceptance and deferrals

Phase 4H's *Help island* can be visually reviewed now, but **final legacy cleanup cannot be completed until the earlier 4C–4G full workspace conversions have passed**. In particular, do not remove global shared scripts, Excel parsing, scheduler overrides, backup/recovery, or their fallbacks just to reduce bundle size.

`tests/e2e/help-parity.cjs` compares the same Help content and markup at 1440×900 and 390×844 in both Vite dev and built sites. All the other stacked tests continue to run.

**Draft stacked PR, not completion of all Phase 4. Production `main` unchanged.**
