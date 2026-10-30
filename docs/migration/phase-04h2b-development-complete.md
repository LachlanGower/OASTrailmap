# Phase 4H.2b — Build consolidation, not Phase 5 acceptance

Stacked on 4H.2a / PR #36. This slice adds release-candidate validation gates and retains legacy rollback code. No legacy script is removed before the user's full-functionality review.

## Validation
- Run TypeScript/Vue typecheck, domain/unit tests, Vite production build and byte-exact legacy asset preservation.
- Build with `OAS_PUBLIC_BASE=/OASTrailmap/` and assert compiled assets use the GitHub Pages subpath; original CSS, JS, data and docs remain available.
- Rebuild root-targeted dist and execute accessibility, recovery failure/cancel, and Data & State parity browser tests on Vite and compiled site.
- PR stays draft. Original workbook acceptance, full/selective restore round-trips, visual/layout audits, 1–60 week stress, and end-user testing are **not** automatically satisfied by this CI.

## Hard stop before Phase 5
**Do not begin Phase 5 until the user has exercised the entire application and explicitly approved proceeding.** No merge or pointer update to `main`. Record any issues found during the user's functional review in fixes to this stack. Current status is development candidate only, not an accepted release candidate.
