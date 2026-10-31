# OAS Trailmap — Detailed Remaining Slices to Phase 5

**Baseline:** Draft PR #25 (Phase 4E.2b), branch `migration/phase-04e2b-vue-week-controls`, stacked on PR #24. This plan is an engineering proposal, not new Scout/OAS curriculum rules or a claim of tested behaviour.

## Branch and release rules

1. Each next PR branches from the immediately preceding PR head and targets that preceding branch. Keep draft PRs unmerged until cumulative user review. Never modify production `main` without explicit Phase 6 release authorization.
2. The original JavaScript logic, private localStorage format, all 142 requirement IDs, 118 app requirements, Excel import/reimport and unknown historical fields remain authoritative unless an explicitly reviewed change says otherwise.
3. Vue islands use the original DOM selectors/classes, forward mutations to existing handlers, and expose an independently testable `?…Renderer=legacy` fallback. Avoid duplicate event handlers, stale snapshots, or stores competing for authority.
4. Each PR must include focused unit tests, Playwright Vue-vs-legacy desktop (1440×900) and phone (390×844) parity, production build/static dist tests, data-preservation tests, and migration notes. A failed gate leaves the PR draft and must not update the preview.
5. Use fictional Scout data in committed tests. The original Cub Pack workbook must be tested privately; never upload its names, records, screenshots or workbook contents to GitHub.

## Remaining Phase 4 execution

### 4E.2c — Scheduler controls and input validation
**Depends on:** PR #25 (4E.2b). **Deliver:** Vue toolbar for strategy (progress/curriculum/location/balanced), week count (1–60), requirements/night (1–12), optional location scoring, external-week preferences, Generate/Regenerate, and YAML import/export entry points. Preserve IDs and legacy actions, and do not combine rendering migration with scheduling algorithm changes. External weeks are suggestions, not venue bookings.

**Acceptance:** Empty/new/loaded schedule, clamped inputs, keyboard accessibility, all four strategies, location-off actually excludes location ranking, external-week parsing, cancel import, export schema parity. Locked weeks survive regenerate. No automatic Scout achievements. Compare fallback `?scheduleToolbarRenderer=legacy`.

**Rollback:** Disable the Vue toolbar only; original controls and generation remain functional.

### 4E.3a — Regeneration and leader override interactions
**Depends on:** 4E.2c. **Deliver:** Vue controls for full generation, unlocked-only regeneration, per-week lock/unlock, theme changes, random/progression reroll, swap-similar and external suggestions, all dispatching to the original domain methods. Make pending changes clear; preserve manual edits and deliberate overrides. Never infer booking or confirmation.

**Acceptance:** Frozen locked weeks byte-equivalent; themed generation restricted to chosen theme; random reroll documented as heuristic; progress mode respects dependencies, including possible prerequisite and dependent within the same session. Swap candidates validated for IDs/readiness/venue where enabled. No silent schedule resets or achievement writes.

**Rollback:** Independent regeneration/interaction fallback; existing schedule remains loadable.

### 4E.3b — Scheduling parity and edge-case hardening
**Depends on:** 4E.3a. **Deliver:** Golden-master fixture matrix, stable event dispatch, scheduling read-only view models, and guardrails for 1, 40 and 60 weeks, zero Scouts, selected subset, unsatisfiable/empty requirement pools, repeated opportunities and unavailable venues. Only fix demonstrated migration regressions; do not reinterpret OAS policy.

**Acceptance:** Deterministic inputs compare Vue and legacy plans, locked/manual changes retained after regeneration, optional location fully disabled when unchecked, no unexpected duplicate activity placements, acceptable 60-week rendering time with measured thresholds captured in PR. Error states do not corrupt storage.

**Rollback:** Retain complete legacy scheduler fallback and snapshots.

### 4E.4a — Vue 142-requirement coverage tracker
**Depends on:** 4E.3b. **Deliver:** Search/status filters, table, counts, CSV export and linked Activity Studio/schedule/Scout evidence information. Separate unaddressed, partial, planned and completed states. Keep 142 curriculum records separate from 118 APP register rows.

**Acceptance:** All 142 IDs exactly once under all-filter, correct counts across selected Scouts, linked activity vs scheduled appearance distinction, CSV content/parity and no Scout records in curriculum-only exports. Filter/search accessibility and large-table mobile behavior.

**Rollback:** `?requirementsTrackerRenderer=legacy`; original source calculations remain.

### 4E.4b — Repeat evidence and conditional forecast
**Depends on:** 4E.4a. **Deliver:** Vue view for distinct evidence opportunities, occurrence count/basis/unit/rationale, leader review and hypothetical week-by-week forecasts. Preserve source-explicit counts, inferred planning counts and editable overrides as separate concepts. A multi-night camp in one weekly block remains an explicitly flagged limitation until a separate evidence policy is approved.

**Acceptance:** First of two distinct opportunities does not grant completion; already-completed Excel evidence never downgrades; per-session evidence not double-counted; 10 km inferred planning estimate distinguished from official requirement; forecast does not mutate Scout records or grant awards; cancel/read-only paths have zero writes.

**Rollback:** Original forecast and leader review remain available; backups preserve evidence.

### 4F.2 — Vue Activity Studio editor
**Depends on:** 4E.4b. **Deliver:** Library list/create/edit/cancel, stable activity IDs, name, description, duration, tags, preferred venue, equipment, preparation, instructions, safety and review, plus existing portable YAML/JSON import/export. Keep suggested coverage separate from leader-confirmed coverage.

**Acceptance:** Create/edit/cancel/reload round trips, duplicate IDs, malformed import cancel, unknown fields retained, venue/tag editing, no personal Scout content in activity-only export, keyboard/mobile editing parity. No scheduling or completion side effect from saving an activity.

**Rollback:** `?activityRenderer=legacy`; original activity handlers and data stay authoritative.

### 4F.3 — Confirmed coverage and multi-activity sessions
**Depends on:** 4F.2. **Deliver:** Vue coverage suggestion/confirmation controls and weekly session activity composition: multiple complementary activities; add/remove/reorder, duration and requirement coverage checks, locations and required prerequisites. Suggestions are distinct from confirmed activities and achievements.

**Acceptance:** Leader can override generated coverage; unchanged confirmed activity IDs survive edits/imports; capacity and duration warnings; dependencies can be sequenced same night; location-off ignores venue ranking; scheduled/confirmed activity never automatically marks a Scout complete. Cancels and rearrangements preserve unrelated schedule/Scout data.

**Rollback:** Original Activity Studio and multi-activity scheduler UI remain available.

### 4G.2 — Vue Data & State import/export dashboard
**Depends on:** 4F.3. **Deliver:** Centralized dashboard for original Excel import, full/individual JSON/YAML imports/exports, item counts, field/reference validation, preview of add/change/remove and unmatched records. Keep workbook parsing/preview and manual achievement preservation first-class.

**Acceptance:** Preview/cancel zero writes; matching Excel highlighted/date evidence and provenance; reimport never silently removes manual achievements; invalid/cyclic/unknown references rejected before commit; curriculum-only export excludes Scout records; old backups load and preserve unknown fields. Test each import category in isolation.

**Rollback:** `?dataManagerRenderer=legacy`, and original Excel fallback independently usable.

### 4G.3 — Backups, checkpoints and dangerous recovery controls
**Depends on:** 4G.2. **Deliver:** Vue full backup/restore, selective recovery, checkpoint/history, snapshot preview/rollback, clear achievements, clear roster, clear schedule/planning, restore default requirements and factory reset. Strong typed or explicit confirmation for destructive operations; recommend backup before destructive actions.

**Acceptance:** Exact full backup restore, selective data isolation, corrupted input fails without writes, rollback survives reload, preservation of manually imported progress in unrelated operations, quota/storage failures recover safely, accessibility and double-click prevention. Test backup round trips with fictional old-state fixtures.

**Rollback:** Retain legacy recovery UI and disaster-recovery procedure; no automatic reset or dangerous migrations.

### 4H.2a — Shared UI and accessibility consolidation
**Depends on:** 4G.3. **Deliver:** Shared Vue UI patterns for fields, feedback, modal focus, lists, accessible labels and navigation. Keep original Help & Design topics, actionable instructions and diagrams. Remove duplicate bindings only when shown redundant by tests.

**Acceptance:** Tab order, ESC/cancel, focus return, keyboard-only navigation, screen-reader names/live announcements, desktop/mobile contrast and overflow, no duplicated event processing, help search parity. Preserve all original IDs and fallback behaviour until complete verification.

**Rollback:** Per-workspace Vue flags, no data migration requirement.

### 4H.2b — Build consolidation and Phase 5 candidate
**Depends on:** 4H.2a. **Deliver:** Audit which legacy files can actually be retired; clean redundant scripts only with explicit parity tests; optimize Vite bundles and static asset paths; validate offline/static-site startup; freeze a traceable Phase 5 candidate manifest with branch SHA, known differences, backup steps and fallbacks.

**Acceptance:** Typecheck, npm audit, domain tests, all Playwright parity suites, production Vite build and static `dist` startup under root/subdirectory URLs; no missing XLSX/YAML dependency; all 142 IDs and application register intact; no private records committed; cumulative zero critical data-loss defects.

**Rollback:** Stable previous PR head and backup/restore instructions. Do not delete fallback assets until Phase 5 explicitly approves.

## Phase 5 — Formal acceptance, not production deployment

### 5.1 Automated complete-product regression
Run all unit/integration/browser tests on pinned build; synthetic workbook, old storage fixture, interrupted import, schedule stress, rollback and isolated feature fallbacks. Produce a pass/fail traceability report cross-linked to the app requirements register. Fail on source-ID drift, corruption, duplicate completion or unexpected writes.

### 5.2 Human acceptance against original
Leader compares original and cumulative Vue application on desktop/mobile: Trailmap, Scout selection and achievements, nine-sheet original workbook import/reimport, Skill Tree, scheduler, Activity Studio, Data & State, Help and trackers. Record every visible/behaviour difference, with required fix or explicit accepted deviation. Real workbook used only locally and privately, not in PR evidence.

### 5.3 Release-candidate readiness and sign-off
Review disaster recovery, full backup, storage quota/corruption handling, accessible controls, 60-week performance, optional location logic and offline/Pages path behaviour. Document unresolved issues and acceptance evidence. Freeze candidate; stop auto-advancing preview. **No merge to production `main`, release or deployment without separate Phase 6 user authorization.**

## GitHub Pages preview policy (pre-Phase 5)

**Current discovery:** repository default branch is `main`. No branch matching `pages`, `gh-pages`, `preview` or `deploy` was found from the GitHub integration on 31 October 2026. The actual GitHub Pages source and active site URL are **not yet confirmed**; moving an arbitrary ref cannot be called a successful deployment.

- Create a dedicated `migration/pages-preview` source branch only after verifying Pages configuration and the build publishing method. Do not point production Pages at migration code.
- For each draft PR, first require build/typecheck, unit tests, targeted browser parity and data safety suites to pass, then publish *built* Vite `dist` with correct base path to the **preview** website. A source branch pointer alone is insufficient for a compiled Vite site.
- Record PR number, source commit SHA, deployed artifact SHA and preview URL in the PR description or preview manifest. Keep a prior preview artifact for rollback.
- If deployment is controlled by a Pages Action, use a dedicated preview workflow/environment with minimal permissions rather than rewriting the published branch. Do not force-update branch pointers.
- If any test or publish step fails, preserve the last known-good preview, leave the draft PR pending and explain the failure.
- At Phase 5 entry freeze preview on the release candidate and require explicit approval before further updates; Phase 6 alone can alter production.

## Recommended branch chain

`PR #25 → 4E.2c → 4E.3a → 4E.3b → 4E.4a → 4E.4b → 4F.2 → 4F.3 → 4G.2 → 4G.3 → 4H.2a → 4H.2b → Phase 5`

**Scope exclusions:** stage-oriented thematic redesign, new Scout policy, new calendar models, cross-group sharing and unrelated architecture redesign remain Future Phases proposals, not migration acceptance criteria.
