# OAS Trailmap — Application Requirements Register

**Purpose:** comprehensive product and implementation register for the **OAS Trailmap web application**. This is **not** the Scouts Outdoor Adventure Skills requirements checklist.

**Status:** working baseline, 2026-10-20, 118 entries. The canonical machine-readable source is [`data/application-requirements.json`](../data/application-requirements.json). Update this JSON when adding features or changing scope, then refresh the website; this Markdown is a review snapshot.

## How to interpret delivery status

- **Implemented in code:** traceable implementation exists, but browser or real-workbook acceptance testing is not implied.
- **Partially implemented:** functionality exists but an agreed capability or verification gap remains.
- **Planned / not complete:** the agreed behaviour is not fully delivered.
- **Future idea only:** brainstorming subject to requirements discovery, not committed implementation.

**Privacy and source-of-truth:** Scout records stay local to each browser. This register describes product behaviour and stores no Scout data. The original Excel workbook remains the required source for initial Scout progress.

## Traceability overview

| Category | Total | Implemented | Partial | Planned | Future |
| --- | ---: | ---: | ---: | ---: | ---: |
| Application & navigation | 8 | 8 | 0 | 0 | 0 |
| Excel onboarding | 8 | 8 | 0 | 0 | 0 |
| Skills and trees | 21 | 20 | 1 | 0 | 0 |
| Scout evidence | 8 | 7 | 0 | 1 | 0 |
| Activity Studio | 14 | 12 | 1 | 0 | 1 |
| Scheduling | 21 | 20 | 1 | 0 | 0 |
| OAS coverage tracking | 3 | 3 | 0 | 0 | 0 |
| Data & recovery | 14 | 9 | 3 | 2 | 0 |
| Help & documentation | 7 | 6 | 1 | 0 | 0 |
| Future discovery | 14 | 0 | 0 | 0 | 14 |

## Application & navigation

### APP-001 — Local-first application

**Delivery:** implemented. **Requirement:** Keep Scout records in the browser; no server database for personal Scout progress.

**Implementation references:** `js/app.js`, `js/data-manager.js`.

**Verification:** Verify no Scout progress requests leave browser.

### APP-002 — GitHub stores code and references only

**Delivery:** implemented. **Requirement:** Do not commit private Scout records to the repository.

**Implementation references:** `.gitignore`, `README.md`.

**Verification:** Review commits and backup handling for PII.

### APP-003 — Static web delivery

**Delivery:** implemented. **Requirement:** Run as a static single-page application without a backend.

**Implementation references:** `index.html`, `js/app.js`.

**Verification:** Test browser serving and hosted deployment.

### APP-004 — Four main workspaces

**Delivery:** implemented. **Requirement:** Provide Trailmap, Skill Tree Mapper, Scheduler, and Activity Studio navigation.

**Implementation references:** `index.html`, `js/studio.js`.

**Verification:** Navigate to each workspace on desktop and mobile.

### APP-005 — Central Data & State workspace

**Delivery:** implemented. **Requirement:** Offer one place to import, inspect, export, reset and restore operational state.

**Implementation references:** `index.html`, `js/data-manager.js`, `js/next-phase.js`.

**Verification:** Run import/export and reset smoke tests.

### APP-006 — Help & Design workspace

**Delivery:** implemented. **Requirement:** Provide approachable in-app guides plus design and appendix.

**Implementation references:** `index.html`, `js/next-phase.js`, `js/docs-upgrade.js`.

**Verification:** Check help navigation and readability.

### APP-007 — Saved locally status

**Delivery:** implemented. **Requirement:** Show local save feedback in the interface.

**Implementation references:** `index.html`, `js/studio.js`.

**Verification:** Exercise save failures and UI feedback.

### APP-008 — Existing Scout progress preserved

**Delivery:** implemented. **Requirement:** New planning features must not silently clear or alter progress.

**Implementation references:** `js/app.js`, `js/data-manager.js`.

**Verification:** Regression test imports, schedule changes and resets.

## Excel onboarding

### APP-009 — Original Excel workbook is the initial progress source

**Delivery:** implemented. **Requirement:** Seed Scout roster and achievements from the supported original Cub Pack workbook; non-negotiable.

**Implementation references:** `js/app.js`, `index.html`.

**Verification:** Acceptance test OAS_CORE_Cub_Pack.xlsx.

### APP-010 — Excel date and highlighted cell completion

**Delivery:** implemented. **Requirement:** Parse dated or highlighted assessment cells as completion evidence.

**Implementation references:** `js/app.js`.

**Verification:** Test date, highlight and blank cells.

### APP-011 — Excel stage and stream sheet matching

**Delivery:** implemented. **Requirement:** Discover supported Scout columns, sheets and assessment rows.

**Implementation references:** `js/app.js`.

**Verification:** Test sheets with varied headings.

### APP-012 — Excel import preview

**Delivery:** implemented. **Requirement:** Review Scouts, matched completions and unmatched workbook rows before applying.

**Implementation references:** `js/app.js`, `index.html`.

**Verification:** Test confirm, cancel and unmatched cases.

### APP-013 — Excel import provenance

**Delivery:** implemented. **Requirement:** Preserve dates, source sheet/row and imported evidence metadata.

**Implementation references:** `js/app.js`.

**Verification:** Inspect record after import and backup.

### APP-014 — Non-destructive workbook reimport

**Delivery:** implemented. **Requirement:** Reimport Excel without silently removing manually recorded achievements.

**Implementation references:** `js/app.js`.

**Verification:** Repeat imports with manual completions.

### APP-015 — Excel importer in Data & State

**Delivery:** implemented. **Requirement:** Keep the original importer accessible centrally after footer cleanup.

**Implementation references:** `index.html`, `js/data-manager.js`.

**Verification:** Test workbook file chooser and preview.

### APP-016 — Remove obsolete footer importer

**Delivery:** implemented. **Requirement:** Remove duplicate import/activity-bank controls from footer.

**Implementation references:** `index.html`, `js/app.js`.

**Verification:** Confirm no orphaned event handlers.

## Skills and trees

### APP-017 — 142 requirements with stable IDs

**Delivery:** implemented. **Requirement:** Load the 142 OAS skills while retaining stable identifiers.

**Implementation references:** `data/requirements.json`, `data/requirements.yaml`.

**Verification:** Validate IDs, counts and references.

### APP-018 — Preserve original requirement wording

**Delivery:** implemented. **Requirement:** Keep source text distinct from derived planning metadata and edits.

**Implementation references:** `data/requirements.json`, `data/requirements.txt`.

**Verification:** Compare reference text against source file.

### APP-019 — Stages are reference metadata

**Delivery:** implemented. **Requirement:** Display stage metadata without a hard stage gating rule in the existing master graph.

**Implementation references:** `js/app.js`, `js/studio.js`.

**Verification:** Verify readiness calculation.

### APP-020 — Mandatory prerequisite relationships

**Delivery:** implemented. **Requirement:** Use prerequisite IDs to control readiness and schedule ordering.

**Implementation references:** `data/requirements.json`, `js/studio.js`.

**Verification:** Check cycles, unknown IDs and readiness.

### APP-021 — Suggested learning links

**Delivery:** implemented. **Requirement:** Keep advisory connections separate from mandatory prerequisites.

**Implementation references:** `data/requirements.json`, `js/studio.js`.

**Verification:** Test advisory links do not block.

### APP-022 — Named skill trees

**Delivery:** implemented. **Requirement:** Organise requirements into named trees with ordering.

**Implementation references:** `js/studio.js`.

**Verification:** Create, rename and reorder a tree.

### APP-023 — Tag-based tree views

**Delivery:** implemented. **Requirement:** Allow skill-tree views based on tags.

**Implementation references:** `js/studio.js`.

**Verification:** Open tag view and compare coverage.

### APP-024 — Skill text, tags and location editing

**Delivery:** implemented. **Requirement:** Edit requirement text, tags, tree assignments and suitable locations.

**Implementation references:** `js/studio.js`.

**Verification:** Save and reload each edit.

### APP-025 — Custom tree graph overrides

**Delivery:** implemented. **Requirement:** Edit tree-specific links without changing the master prerequisite graph.

**Implementation references:** `js/studio.js`.

**Verification:** Compare master versus custom link edits.

### APP-026 — Remove individual prerequisite links

**Delivery:** implemented. **Requirement:** Break parent or child links individually, including in cyclic graphs.

**Implementation references:** `js/studio.js`.

**Verification:** Remove link with a cycle present.

### APP-027 — Prevent new prerequisite cycles

**Delivery:** implemented. **Requirement:** Reject newly added cyclic mandatory parent links.

**Implementation references:** `js/studio.js`.

**Verification:** Attempt to add a back edge.

### APP-028 — Focused dependency view

**Delivery:** implemented. **Requirement:** Show selected requirement ancestors and descendants without unrelated branches.

**Implementation references:** `js/studio.js`, `index.html`.

**Verification:** Focus and restore full graph.

### APP-029 — Tree editor undo and snapshots

**Delivery:** implemented. **Requirement:** Offer local checkpoints and convenient undo for graph edits.

**Implementation references:** `js/studio.js`.

**Verification:** Undo a saved tree edit.

### APP-030 — Editable tag library

**Delivery:** implemented. **Requirement:** Add and rename controlled tags used across requirements and activities.

**Implementation references:** `js/studio.js`.

**Verification:** Rename an in-use tag.

### APP-031 — Main Trailmap tag filter

**Delivery:** partial. **Requirement:** Filter skill map by selected tags.

**Implementation references:** `js/app.js`, `index.html`.

**Verification:** Confirm support for multi-tag any/all matching; current UI is single tag.

### APP-032 — Preferred and acceptable alternative locations

**Delivery:** implemented. **Requirement:** Store one preferred location and zero or more acceptable alternatives.

**Implementation references:** `js/studio.js`, `data/requirements.json`.

**Verification:** Edit and reload locations.

### APP-033 — Optional locations in scheduling

**Delivery:** implemented. **Requirement:** Make location matching optional, including excluding it from ranking.

**Implementation references:** `js/theme-tracker.js`, `js/forecast.js`, `js/next-phase.js`.

**Verification:** Compare scoring with checkbox on/off.

### APP-034 — Per-requirement repeat opportunity metadata

**Delivery:** implemented. **Requirement:** Store count, unit, basis and rationale with each requirement.

**Implementation references:** `data/requirements.json`, `data/requirements.yaml`, `data/requirements.txt`.

**Verification:** Check all 142 records.

### APP-035 — Explicit multi-experience source counts

**Delivery:** implemented. **Requirement:** Use source numbers for requirements such as multiple bushwalks and camp nights.

**Implementation references:** `data/requirements.txt`, `docs/repeat-counts.md`.

**Verification:** Review explicit counts with source wording.

### APP-036 — Clearly labelled inferred repeat counts

**Delivery:** implemented. **Requirement:** Default conservatively and distinguish planning guesses from official requirement wording.

**Implementation references:** `data/requirements.txt`, `docs/repeat-counts.md`.

**Verification:** Review one inferred 10 km case.

### APP-037 — Editable repeat counts in skill editor

**Delivery:** implemented. **Requirement:** Let a leader adjust how many distinct opportunities are planned.

**Implementation references:** `js/studio.js`.

**Verification:** Edit and export a count.

## Scout evidence

### APP-038 — Scout roster and selectors

**Delivery:** implemented. **Requirement:** Select all Scouts or a subset for readiness and planning.

**Implementation references:** `js/app.js`, `js/studio.js`.

**Verification:** Test all/subset selection.

### APP-039 — Individual completion states

**Delivery:** implemented. **Requirement:** Store Scout-by-requirement completion evidence and dates.

**Implementation references:** `js/app.js`.

**Verification:** Reopen after reload.

### APP-040 — Progress and readiness map

**Delivery:** implemented. **Requirement:** Show completed, ready and prerequisite-blocked skills.

**Implementation references:** `js/app.js`, `index.html`.

**Verification:** Validate against known records.

### APP-041 — Leader approval of achievements

**Delivery:** implemented. **Requirement:** Only leader evidence review or manual update can award completion.

**Implementation references:** `js/studio.js`, `js/forecast.js`.

**Verification:** Plan and confirm without automatic award.

### APP-042 — Same-night foundational and dependent skills

**Delivery:** implemented. **Requirement:** Permit planning a prerequisite and its dependent skill in the same session.

**Implementation references:** `js/studio.js`, `js/forecast.js`.

**Verification:** Test within-week ordering.

### APP-043 — Multiple distinct session evidence credits

**Delivery:** implemented. **Requirement:** Record evidence per week for skills needing repeated experiences.

**Implementation references:** `js/forecast.js`.

**Verification:** Confirm first of two remains incomplete.

### APP-044 — Preserve existing imported completions with repeat counts

**Delivery:** implemented. **Requirement:** Do not downgrade already complete Excel records when adding repeat metadata.

**Implementation references:** `js/forecast.js`.

**Verification:** Import workbook then forecast.

### APP-045 — Multi-day camp evidence within one weekly block

**Delivery:** planned. **Requirement:** Count actual distinct nights even when one camp spans several nights.

**Implementation references:** `js/forecast.js`, `docs/repeat-counts.md`.

**Verification:** Define overnight evidence and calendar model.

## Activity Studio

### APP-046 — Reusable Activity Studio library

**Delivery:** implemented. **Requirement:** Create and edit reusable activities rather than duplicate session text.

**Implementation references:** `js/data-manager.js`, `index.html`.

**Verification:** Create, edit, reload and export.

### APP-047 — Structured activity plans

**Delivery:** implemented. **Requirement:** Support duration, equipment, preparation, instructions, safety and review prompts.

**Implementation references:** `js/data-manager.js`.

**Verification:** Check all sections persist.

### APP-048 — Activity tags and locations

**Delivery:** implemented. **Requirement:** Assign tags and suitable venue to an activity.

**Implementation references:** `js/data-manager.js`.

**Verification:** Test matching with/without locations.

### APP-049 — Requirement suggestions from tags and location

**Delivery:** implemented. **Requirement:** Suggest likely requirement coverage using activity metadata.

**Implementation references:** `js/data-manager.js`.

**Verification:** Compare suggestions to matching tags.

### APP-050 — Leader-confirmed requirement coverage

**Delivery:** implemented. **Requirement:** Let leaders add, remove and confirm requirements rather than relying on automatic mapping.

**Implementation references:** `js/data-manager.js`.

**Verification:** Save user-adjusted coverage.

### APP-051 — Activities YAML import/export

**Delivery:** implemented. **Requirement:** Move activity libraries with portable YAML.

**Implementation references:** `js/data-manager.js`.

**Verification:** Round-trip structured content.

### APP-052 — Stable activity references

**Delivery:** implemented. **Requirement:** Use activity IDs in scheduled weeks.

**Implementation references:** `js/next-phase.js`.

**Verification:** Reload a referenced activity.

### APP-053 — Activity impact previews

**Delivery:** partial. **Requirement:** Show activity coverage and possible Scout benefit before a leader confirms a night.

**Implementation references:** `js/next-phase.js`, `js/studio.js`.

**Verification:** Verify multi-activity recommendation and Scout impact per activity.

### APP-054 — Suggested combinations for a Scout night

**Delivery:** implemented. **Requirement:** Automatically propose complementary activities based on confirmed coverage.

**Implementation references:** `js/next-phase.js`.

**Verification:** Test suggested group and duration.

### APP-055 — Manual activity combination editing

**Delivery:** implemented. **Requirement:** Allow add/remove/reorder of multiple activity references.

**Implementation references:** `js/next-phase.js`.

**Verification:** Edit and persist a session.

### APP-056 — Leader confirmation for session combinations

**Delivery:** implemented. **Requirement:** Keep suggestions provisional until confirmed.

**Implementation references:** `js/next-phase.js`.

**Verification:** Check confirmed state survives reload.

### APP-057 — Combined duration and unique coverage

**Delivery:** implemented. **Requirement:** Sum activity durations and count each covered requirement once.

**Implementation references:** `js/next-phase.js`.

**Verification:** Test overlaps and overtime warning.

### APP-058 — Location conflicts in combined activity nights

**Delivery:** implemented. **Requirement:** Warn leaders when combined activities use multiple venues if locations enabled.

**Implementation references:** `js/next-phase.js`.

**Verification:** Check conflicts and disabled-location behaviour.

### APP-059 — Reusable whole-night session templates

**Delivery:** future. **Requirement:** Save a full multi-activity sequence for future weeks or terms.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Discovery and acceptance criteria required.

## Scheduling

### APP-060 — 40-week planning defaults

**Delivery:** implemented. **Requirement:** Default to one main session each week for a 40-week curriculum.

**Implementation references:** `js/studio.js`.

**Verification:** Check initial defaults.

### APP-061 — Flexible 1–60 week generation

**Delivery:** implemented. **Requirement:** Allow any whole number of weeks from 1 through 60.

**Implementation references:** `index.html`, `js/studio.js`.

**Verification:** Generate 1, 40 and 60 weeks.

### APP-062 — Configurable capacity per week

**Delivery:** implemented. **Requirement:** Set default and per-week requirement capacity.

**Implementation references:** `js/studio.js`.

**Verification:** Change capacity and regenerate.

### APP-063 — Progress-focused strategy

**Delivery:** implemented. **Requirement:** Prioritise readiness, broad Scout benefit and foundational unlocks.

**Implementation references:** `js/forecast.js`.

**Verification:** Compare expected ordering.

### APP-064 — Location-focused strategy

**Delivery:** implemented. **Requirement:** Prefer compatible activity locations when enabled.

**Implementation references:** `js/forecast.js`, `js/theme-tracker.js`.

**Verification:** Test locations toggle.

### APP-065 — Balanced strategy

**Delivery:** implemented. **Requirement:** Combine Scout progression and compatible-location grouping.

**Implementation references:** `js/forecast.js`.

**Verification:** Compare mixed plans.

### APP-066 — Curriculum-first strategy

**Delivery:** implemented. **Requirement:** Generate a plan without relying on selected Scout completion records.

**Implementation references:** `js/studio.js`, `js/forecast.js`.

**Verification:** Generate in curriculum mode.

### APP-067 — Locked weeks and selective regeneration

**Delivery:** implemented. **Requirement:** Preserve explicitly locked sessions when regenerating remaining weeks.

**Implementation references:** `js/forecast.js`, `js/studio.js`.

**Verification:** Regenerate with locked weeks.

### APP-068 — External venue suggestions and preferred weeks

**Delivery:** partial. **Requirement:** Suggest external activities, prefer chosen weeks and allow leader confirmation.

**Implementation references:** `js/studio.js`, `js/forecast.js`, `js/next-phase.js`.

**Verification:** Verify no booking/confirmation integration is implied.

### APP-069 — Visual week timeline

**Delivery:** implemented. **Requirement:** Show weeks and planned requirement counts on a navigable timeline.

**Implementation references:** `js/studio.js`, `index.html`.

**Verification:** Inspect timeline with 60 weeks.

### APP-070 — Conditional Scout progress forecast

**Delivery:** implemented. **Requirement:** Chart possible completed requirements by week without recording achievements.

**Implementation references:** `js/forecast.js`.

**Verification:** Forecast after one versus two evidence nights.

### APP-071 — Similar requirement swaps

**Delivery:** implemented. **Requirement:** Suggest alternative skills using tags, stream, location and readiness.

**Implementation references:** `js/forecast.js`.

**Verification:** Replace a requirement and inspect forecast.

### APP-072 — Themed week regeneration

**Delivery:** implemented. **Requirement:** Changing a week's theme regenerates matching requirements.

**Implementation references:** `js/theme-tracker.js`, `js/studio.js`.

**Verification:** Select a theme and check result.

### APP-073 — Random within-theme selection

**Delivery:** implemented. **Requirement:** Generate a random eligible themed selection without promising ideal progression.

**Implementation references:** `js/theme-tracker.js`.

**Verification:** Reroll and confirm matching theme.

### APP-074 — Best-for-progression themed selection

**Delivery:** implemented. **Requirement:** Rank themed choices using impact, readiness and dependency unlocking.

**Implementation references:** `js/theme-tracker.js`.

**Verification:** Compare progression scores.

### APP-075 — Protect manual themed changes

**Delivery:** implemented. **Requirement:** Lock the week after a themed regeneration or swap.

**Implementation references:** `js/theme-tracker.js`, `js/forecast.js`.

**Verification:** Run overall regeneration.

### APP-076 — Repeated requirement placement

**Delivery:** implemented. **Requirement:** Plan a requirement across enough distinct weeks to meet its occurrence count.

**Implementation references:** `js/forecast.js`.

**Verification:** Count repeat appearances.

### APP-077 — Week theme choice controls

**Delivery:** implemented. **Requirement:** Expose theme chooser and per-week random/progression reroll controls.

**Implementation references:** `js/theme-tracker.js`, `index.html`.

**Verification:** Exercise UI reroll.

### APP-078 — Schedule YAML import/export

**Delivery:** implemented. **Requirement:** Export/import weekly plan without Scout achievements.

**Implementation references:** `js/studio.js`, `js/data-manager.js`.

**Verification:** Round-trip locked weeks and activity IDs.

### APP-079 — Week-level Scout evidence review

**Delivery:** implemented. **Requirement:** Record achievement evidence for a scheduled night.

**Implementation references:** `js/forecast.js`, `js/studio.js`.

**Verification:** Review and verify record provenance.

### APP-080 — Forecast limitations clearly stated

**Delivery:** implemented. **Requirement:** Label forecasts as hypothetical and do not equate planned work with completion.

**Implementation references:** `js/forecast.js`, `docs/workflows.md`.

**Verification:** Review chart text and labels.

## OAS coverage tracking

### APP-081 — OAS requirement coverage inventory

**Delivery:** implemented. **Requirement:** Show all 142 Scout requirements and how they are addressed by planned weeks and activities.

**Implementation references:** `js/theme-tracker.js`, `index.html`.

**Verification:** Inspect all requirements.

### APP-082 — OAS tracker coverage states

**Delivery:** implemented. **Requirement:** Classify unaddressed, partial, planned and completed-for-selected-Scouts.

**Implementation references:** `js/theme-tracker.js`.

**Verification:** Check edge cases for Scout subsets.

### APP-083 — OAS tracker search and export

**Delivery:** implemented. **Requirement:** Search skill IDs/text/tags and export a CSV.

**Implementation references:** `js/theme-tracker.js`.

**Verification:** Download and inspect CSV.

## Data & recovery

### APP-084 — Complete application backup

**Delivery:** implemented. **Requirement:** Export a local full-state JSON backup including operational records.

**Implementation references:** `js/data-manager.js`.

**Verification:** Export and restore offline.

### APP-085 — Individual dataset imports and exports

**Delivery:** implemented. **Requirement:** Handle requirements, progress, activities, schedules and trees separately.

**Implementation references:** `js/data-manager.js`.

**Verification:** Run per-dataset round-trip.

### APP-086 — Import validation

**Delivery:** partial. **Requirement:** Validate file formats, IDs and references before modifying state.

**Implementation references:** `js/data-manager.js`.

**Verification:** Add complete prerequisite-cycle and detailed schema validation.

### APP-087 — Import preview and change summary

**Delivery:** partial. **Requirement:** Show added, changed and removed records before approval.

**Implementation references:** `js/data-manager.js`.

**Verification:** Add field-by-field changes and destructive-change warnings.

### APP-088 — Checkpoints and snapshot history

**Delivery:** implemented. **Requirement:** Save pre-import and manual recovery points.

**Implementation references:** `js/data-manager.js`, `js/studio.js`.

**Verification:** Recover from a targeted change.

### APP-089 — Selective dataset rollback

**Delivery:** implemented. **Requirement:** Restore one dataset without reversing unrelated Scout achievements.

**Implementation references:** `js/data-manager.js`.

**Verification:** Rollback schedule without progress change.

### APP-090 — Clear achievements retaining roster

**Delivery:** implemented. **Requirement:** Remove completion evidence but retain Scout identity records.

**Implementation references:** `js/next-phase.js`.

**Verification:** Reset and reimport Excel.

### APP-091 — Clear Scout roster and progress

**Delivery:** implemented. **Requirement:** Remove all Scout-specific local records with explicit confirmation.

**Implementation references:** `js/next-phase.js`.

**Verification:** Run destructive confirm in browser.

### APP-092 — Clear planning data

**Delivery:** implemented. **Requirement:** Clear schedule and locks without deleting Scout achievement records.

**Implementation references:** `js/next-phase.js`.

**Verification:** Inspect before/after.

### APP-093 — Restore default requirements

**Delivery:** implemented. **Requirement:** Restore the bundled normalized requirements baseline without wiping Scout progress.

**Implementation references:** `js/next-phase.js`, `data/requirements.json`.

**Verification:** Preview and restore default skills.

### APP-094 — Restore verbatim original OAS source file

**Delivery:** partial. **Requirement:** Keep the literal original OAS-Requirements.txt as an immutable source separate from normalized defaults.

**Implementation references:** `data/requirements.txt`, `docs/repeat-counts.md`.

**Verification:** The repository contains an annotated requirements.txt, not the original verbatim source.

### APP-095 — Factory reset with backup safeguard

**Delivery:** implemented. **Requirement:** Offer comprehensive local reset and explicit warning/backup path.

**Implementation references:** `js/next-phase.js`.

**Verification:** Verify no unintentional wipe.

### APP-096 — Storage health and backup recency

**Delivery:** planned. **Requirement:** Surface storage quota, backup status, source timestamps and recovery readiness.

**Implementation references:** `js/data-manager.js`.

**Verification:** Define signals and privacy-safe metadata.

### APP-097 — Import history and duplicates review

**Delivery:** planned. **Requirement:** Show past data imports and conflicting Scout/activity matches.

**Implementation references:** `js/data-manager.js`.

**Verification:** Specify record provenance and merge policy.

## Help & documentation

### APP-098 — First-run nontechnical setup guide

**Delivery:** implemented. **Requirement:** Walk leaders through Excel import, Scout selection and backup.

**Implementation references:** `js/next-phase.js`, `js/docs-upgrade.js`.

**Verification:** Read with a first-time leader.

### APP-099 — Everyday leader guides

**Delivery:** implemented. **Requirement:** Document progress review, activities, planning nights and backups.

**Implementation references:** `js/next-phase.js`, `docs/workflows.md`.

**Verification:** Check against current UI.

### APP-100 — Workflow graphs

**Delivery:** implemented. **Requirement:** Provide diagrams showing how Excel, progress, activities and schedules connect.

**Implementation references:** `js/docs-upgrade.js`, `docs/workflows.md`.

**Verification:** Check mobile, keyboard and screen-reader fallback.

### APP-101 — Design explanations and appendix

**Delivery:** implemented. **Requirement:** Explain graph rules, scheduler, storage, evidence and data formats.

**Implementation references:** `js/next-phase.js`, `docs/workflows.md`.

**Verification:** Technical consistency review.

### APP-102 — Help search

**Delivery:** implemented. **Requirement:** Search in-app user guides by title and content.

**Implementation references:** `js/next-phase.js`.

**Verification:** Search troubleshooting and setup.

### APP-103 — Contextual help near controls

**Delivery:** partial. **Requirement:** Explain complex choices in place without needing to open a separate guide.

**Implementation references:** `js/next-phase.js`, `index.html`.

**Verification:** Broaden contextual help coverage.

### APP-104 — Future phases clearly marked provisional

**Delivery:** implemented. **Requirement:** Keep brainstormed proposals separate from agreed implementation work.

**Implementation references:** `docs/future-phases.md`, `js/theme-tracker.js`.

**Verification:** Check no proposal is mislabelled shipped.

## Future discovery

### APP-105 — Stage-oriented night redesign

**Delivery:** future. **Requirement:** Investigate four requirements per stage per night, cohesive themes and mixed-stage delivery.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Discover group composition, acceptance criteria and model.

### APP-106 — Stages become soft prerequisites again

**Delivery:** future. **Requirement:** Investigate using stage progression as guidance rather than mandatory blocking.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Resolve interactions with master prerequisites.

### APP-107 — Repeated delivery across stages

**Delivery:** future. **Requirement:** Investigate repeat counts needed when staging themed nights across groups.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Model progress evidence and stage-specific delivery.

### APP-108 — Human-readable modular rewrite

**Delivery:** future. **Requirement:** Reorganise coupled scripts into clear modules with names, tests and maintainable structure.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Architecture discovery and migration plan.

### APP-109 — Central configuration system

**Delivery:** future. **Requirement:** Move scheduling weights, stage policies, locations, timing and counts to documented settings.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Agree configuration schema and defaults.

### APP-110 — Reusable night templates

**Delivery:** future. **Requirement:** Support reusable multi-activity session templates.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Specify template versioning and custom edits.

### APP-111 — Calendar and term date support

**Delivery:** future. **Requirement:** Map week slots onto actual dates, camps and holidays.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Decide jurisdiction and date handling.

### APP-112 — Gear and leader resource planning

**Delivery:** future. **Requirement:** Track equipment, consumables, venues and leader qualification needs.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Privacy and feasibility discovery.

### APP-113 — Progress analytics and reporting

**Delivery:** future. **Requirement:** Explore readiness bottlenecks, coverage gaps and printable review forms.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Avoid misinterpreting hypothetical forecasts.

### APP-114 — Cross-group library sharing

**Delivery:** future. **Requirement:** Share nonpersonal activities and reference content across groups.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Define provenance and sharing boundaries.

### APP-115 — Offline-installable experience

**Delivery:** future. **Requirement:** Explore installable PWA/offline continuity with careful local data handling.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Specify updates, storage loss and restore guidance.

### APP-116 — Optional connected systems

**Delivery:** future. **Requirement:** Investigate opt-in Scout system integrations, subject to privacy controls.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Permissions and identity matching discovery.

### APP-117 — Accessibility and translations

**Delivery:** future. **Requirement:** Improve keyboard support, print views, language access and touch sizing.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Conduct accessibility audit.

### APP-118 — Evidence provenance and migrations

**Delivery:** future. **Requirement:** Improve audit histories and portable backup migrations.

**Implementation references:** `docs/future-phases.md`.

**Verification:** Agree retention and rollback semantics.

## Working agreement

This register exists to preserve product context across future conversations, branches, maintainers and UI changes. The presence of code does not prove requirements are completely tested. Mark any new feature as partial or planned until an identifiable implementation exists; keep future brainstorms separate from delivered capabilities. When a release is accepted, update status, implementation references and verification notes alongside the code.
