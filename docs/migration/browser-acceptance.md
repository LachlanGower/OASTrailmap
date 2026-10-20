# Phase 1 — baseline browser acceptance script

This is the **baseline reference for future user-facing parity**. The initial Phase 1 source audit does not imply these steps have passed. Use a fresh temporary browser profile to avoid real Scout data. Never commit actual Scout names, copied `localStorage` or original workbook data.

| ID | Test scenario | Baseline action and required evidence | APP requirements | Result |
| --- | --- | --- | --- | --- |
| B01 | Fresh local load | Serve repository root with a static HTTP server; open app; verify no startup errors and 142 requirements display | APP-001, APP-003, APP-017 | Not run |
| B02 | Seven workspace tabs | Switch Trailmap, Mapper, Scheduler, Activity Studio, Data & State, Help & Design, Application Requirements; no blank/crashed panel | APP-004, APP-005, APP-006 | Not run |
| B03 | Requirement selection/filter | Filter stage, stream, tag, search and status; open a requirement; check details and readiness | APP-018, APP-031, APP-040 | Not run |
| B04 | Synthetic progress update | Import or seed only fictional Scout data, change one completion, reload and verify the same ID/state | APP-008, APP-039 | Not run |
| B05 | Pack and subset | Switch all, one and a group of example Scouts; verify totals and filtering scope | APP-038, APP-040 | Not run |
| B06 | Original Excel workbook | In a private local test only, import the original workbook; review sheet/date/highlight/unmatched preview; verify imported provenance and non-destructive reimport | APP-009…APP-015 | Not run |
| B07 | Skill Tree Mapper | Change tree/tag selection; edit a skill; create/remove local and master links; verify cycle rejection and rollback snapshot | APP-019…APP-037 | Not run |
| B08 | Schedule creation | Generate 40 weeks, verify 4/night defaults, optional location mode, prerequisite ordering; ensure completion unchanged | APP-041, APP-042, APP-060…APP-066 | Not run |
| B09 | Scheduler variants | Try 1 and 60 weeks, locked week regeneration, themed random/best reroll, preferred venue, and similar swap | APP-061, APP-067…APP-077 | Not run |
| B10 | Activity Studio | Create and edit fictional activity, link requirements manually, export/import; no auto-completion | APP-046…APP-059 | Not run |
| B11 | Weekly session evidence | Confirm a session then review multiple occurrences for a requirement; verify imported completions stay authoritative | APP-041…APP-045, APP-079 | Not run |
| B12 | Forecast/coverage | Forecast remains conditional, OAS requirements tracker covers all 142 requirements and exports CSV | APP-070, APP-080…APP-083 | Not run |
| B13 | Data & State round trips | Export/import full state, individual progress/requirements/activities/schedule/tree exports; validate change preview and checkpoints | APP-084 onward in DATA category | Not run |
| B14 | Recovery | Test resets and rollback in a fresh disposable browser; ensure prominent confirmation before destructive actions | DATA category | Not run |
| B15 | Application Requirements | Search by APP ID, filter statuses/categories, expand details and export JSON/CSV | Application register requirements | Not run |
| B16 | No data leakage | Use a browser network inspector while changing Scout progress; confirm it stays local | APP-001, APP-002 | Not run |
| B17 | Mobile + keyboard | Check at 390×844 and 1440×900; verify navigation, scrolling, focus order, dialogs and controls | APP-004, APP-006 | Not run |
| B18 | Static hosting | Serve from a nested repository-style path; check relative URLs, assets and data fetches | APP-003 | Not run |

## Evidence recording and comparison

For each scenario record: `Pass`/`Fail`/`Blocked` plus the browser/version, viewport, branch/commit SHA, fixture name, screenshot location (if nonpersonal), any console/network error and a brief behaviour note.

Screenshot capture targets at **1440×900** and **390×844**: initial Trailmap, a requirement detail card, Mapper tree, Scheduler generated grid, Activity Studio, Data & State, Help & Design and Application Requirements. Capture **no actual Scout roster/progress** in screenshots stored in Git.

Compare the old and new application using the same fictional dataset. Do not change a source status to 'verified' just because a function exists or a static guardrail passes.

## Separate bug fixes from refactor

When a previously broken workflow is found: (1) record the original observable failure; (2) add a regression scenario; (3) note the linked APP ID; (4) implement the smallest repair; (5) label the intentional behavioural difference in the migration PR. Everything else should remain functionally unchanged.

## Suggested initial invocation

```bash
python -m http.server 8000
# Open http://localhost:8000 in a fresh browser profile
npm run check:baseline
```

**Outstanding gate:** Browser screenshots and actual original Excel workbook import/reimport must be verified before migration is approved for production. This checklist is an actionable plan, not a claim of passing results.
