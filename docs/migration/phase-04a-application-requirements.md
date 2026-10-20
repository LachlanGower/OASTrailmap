# Phase 4A — Application Requirements Vue workspace

This PR begins Phase 4 **incrementally**: only the *Application Requirements* workspace changes its rendering technology. The Trailmap, Skill Tree Mapper, Scheduler, Activity Studio, Data & State, Help & Design, requirement map, Scout progress, workbook imports, storage and recovery remain the original implementation.

## What changed, and why

- `index.html` adds a single Vite-managed module entry. The original ten script sources retain their original order. No existing static DOM ID was removed.
- `vite.config.ts` now builds **both** `index.html` and `vue-preview.html`. All existing `css/`, `js/`, `data/` and `docs/` files are copied to `dist/` byte-for-byte.
- `src/features/application-requirements/ApplicationRequirements.vue` reproduces the existing heading, status summary, controls, card layout, details and export buttons using the **same existing CSS classes and element IDs**. It introduces no new visual design.
- `catalogue.ts` contains pure input validation, search, filtering and byte-equivalent CSV/JSON generation; it does **not** use Scout data or localStorage.
- `mount.ts` fetches and validates the existing `data/application-requirements.json` register. Only after Vue mounts successfully does it replace the old section. This avoids leaving an empty workspace if the Vue bundle is unavailable.
- The old `js/application-requirements.js` remains for fallback. It skips writing to the register DOM after Vue becomes active. Other legacy workspaces, and the existing navigation controller, continue as before.

## Reviewer runbook

```bash
npm ci
npm run dev
```

Open **http://localhost:5173/**. All old workspaces are still present; selecting **Application Requirements** uses Vue by default. To compare directly with the pre-migration renderer, open **http://localhost:5173/?appReqRenderer=legacy** in another tab.

A successful Vue takeover marks `<html data-app-requirements-renderer="vue">`. The legacy query mode leaves that attribute unset. The marker is a development diagnostic, not a user control.

Check that the new panel has the same text and five summary counters; try APP ID and text search, status and area filters, clear filters, opening **Implementation and verification**, downloading CSV/JSON, navigating to another workspace and back, and the narrow/mobile layout. Both renderers use the same source catalogue and download names.

## Automated acceptance

```bash
npm run check:baseline
npm run test:domain
npm run build
npm run check:dist
```

`tests/e2e/app-register-parity.cjs` compares search/filter results, 118 APP IDs, status totals, expanded details, CSV/JSON download **contents**, and navigation for Vue versus the legacy renderer at 1440px and 390px. No personal Scout data is used. GitHub Actions also runs the existing application browser tests on PRs.

## Fallback and limitations

- `?appReqRenderer=legacy` forces the original register renderer for the entire page.
- If Vue code fails to load or the new catalogue validation fails, the pre-existing register implementation remains. The console records a warning, but no Scout data is modified.
- There is still an additional read of the **public** application requirements JSON while the legacy script is enabled. This is harmless but will be eliminated when the legacy register code is removed in a later, reviewed cleanup.
- This is a **single-feature** Vue migration; the other six workspaces, original workbook parser, localStorage writes, scheduler and tree-editor logic are intentionally unchanged.
- No production deployment, no merge to `main` and no change to current browser data formats.

## Gate

Review side-by-side screenshots and browser parity test results. Obtain manual sign-off specifically on the visible Application Requirements screen before merging Phase 4A into `migration/trunk`. Continue remaining workspaces on **separate** Phase 4 branches.
