# OAS Trailmap — Future Phases (Brainstorm)
> **Status: exploratory ideas only.** These are not committed requirements, estimates, or approved development work. Review with leaders and agree scope, privacy, tests and acceptance criteria before implementation.

## Candidate themes

### Program and session reuse
- Convert successful multi-activity sessions into reusable templates.
- Map 40-week program slots to term dates, excursions, camps and public holidays.
- Equipment, consumables, venue constraints and leader qualification checks.

### Activity and requirement libraries
- Shared *non-personal* activity packs that can be imported across Scout groups.
- Improved recommendation explainability: what requirements and Scout needs each activity matches.
- Requirement provenance: compare original wording, locally edited text and approved revisions.

### Scout progress and evidence
- Progress insights showing readiness, bottlenecks and unlocks by stream.
- Print-friendly session review forms and reports.
- Clearly defined evidence history and change tracking; avoid storing sensitive Scout data in GitHub.

### Reliability and accessibility
- Installable/offline-friendly delivery and planned migrations between backup formats.
- Accessibility review: keyboard controls, larger touch targets, high contrast and screen reader hints.
- Help walkthroughs for nontechnical leaders, with plain-language troubleshooting.

### Integrations (future discovery only)
- Optional authorised integrations with Scout membership/progress systems.
- Export or sync only after explicit consent, privacy and identity matching design.

## Proposed stage-oriented planning rework (brainstorm, not approved)
- Explore a stage-led activity-night target of **four requirements per stage per night** so leaders can plan stage-specific coverage in predictable groups.
- Make **themes a key organising principle**: each night should group requirements that can be delivered through coherent shared activities, rather than merely filling a numerical capacity.
- Reintroduce **stages as soft prerequisites**: stage order influences recommendations and forecasts but does not automatically block suitable cross-stage activities or mixed-readiness Scouts.
- Revisit repeat opportunities when a shared themed night addresses the same skill at multiple stages or for different Scout groups. Some requirements may need repeated delivery to satisfy soft stage progression.
- Discovery must resolve how mixed stages, shared activities, attendance, evidence counts and a four-per-stage target interact before implementation.

## Maintainable architecture and configuration redesign (brainstorm, not approved)
- Rewrite the current tightly coupled application scripts into a **human-readable, modular, maintainable codebase** with clear naming, separation of concerns, tests and explanatory documentation.
- Move tunable choices such as scheduling weights, theme scoring, locations, stage policy, evidence counts, and available weeks into **well-documented configuration** instead of scattered literals.
- Retain local-first privacy, the initial Excel import, stable requirement IDs and backwards-compatible migration of existing local backups.
- Decide an appropriate framework/toolchain only after reviewing offline operation, hosting simplicity and ease of handover to nontechnical volunteers.

## Discovery checklist for every proposal
1. Describe the leader's task and a concrete example.
2. Specify whether it touches personal Scout data.
3. Define the source of truth and rollback behaviour.
4. Identify migration and backward compatibility expectations.
5. Write acceptance tests, including realistic Excel workbook import tests.
6. Confirm priority, effort and dependencies before placing in a release.

## Current behaviour versus future ideas
Current releases provide local-first Scout progress, the original Excel workbook importer, requirement mapping, activity authoring, and a requirements-based schedule. Subsequent branches add reset/recovery, multi-activity suggestions, in-app guides, occurrence-based planning and requirement coverage reporting. The stage-led redesign and modular rewrite above remain brainstorming only. No future-phase idea above should be presented as shipped or approved.
