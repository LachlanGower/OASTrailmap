# Phase 4B — Vue navigation shell

**Stack position:** `migration/trunk` (merged and approved 4A) → `migration/phase-04b-vue-navigation`.
**Scope:** the seven workspace navigation controls and Undo button are now Vue-rendered, with original business logic and subpages unchanged.

## Compatibility and safety

The legacy code assigns `onclick` handlers at multiple asynchronous initialization points: `studioInit`, `dataManagerInit`, `showHelp` binding and the Application Requirements catalogue loader. The Vue shell waits for **all eight original handlers** before touching the navigation. It captures those handlers and renders the **same buttons, IDs, class names and order**, then delegates button clicks back to their original operations. No browser storage keys, saved records, titles or body panels are changed.

If a handler never initializes or the Vue shell fails to mount, the original bar stays on screen. The URL flag `?navRenderer=legacy` explicitly disables navigation takeover. `?appReqRenderer=legacy` independently forces the original Application Requirements panel.

The seven workspace panels still use their original implementations. This is **not** a conversion of the underlying Scout progress, scheduling, graph editing or recovery modules.

## Review

```bash
npm ci
npm run dev
```

Compare:
- http://localhost:5173/
- http://localhost:5173/?navRenderer=legacy

Click **Trailmap → Skill Tree Mapper → 40-week Scheduler → Activity Studio → Data & State → Help & Design → Application Requirements**, then return to Trailmap. Check active button classes and the visible panel match; switching one panel never displays two. Compare at desktop and mobile widths. The new Vue navigation is marked `data-oas-nav-renderer="vue"`.

## Gates

- `npm test`, `npm run build`, `npm run check:dist`, `npm audit --audit-level=moderate`.
- Playwright browser compares Vue and legacy nav **for all seven panels** on both Vite dev and static build, 1440×900 and 390×844.
- Legacy 4A register/export and Phase 1–3 browser tests still apply.
- This stack remains **draft** until user visual sign-off; never deploy migration branches to production `main`.

## Later steps

4C–4H each branch from the preceding branch, allowing a final stack build to combine approved work. Future preparatory branches are not automatically considered accepted, complete, or safe to merge simply because the shell passes its navigation tests.
