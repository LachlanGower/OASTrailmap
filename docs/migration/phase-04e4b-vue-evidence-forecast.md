# Phase 4E.4b — Vue conditional forecast and repeat evidence presentation

Stacked on draft PR #30. Vue renders the forecast summary, trajectory and insufficient repeat-opportunity list from a **read-only projection** of the original `forecastModel()` and `scheduleOccurrenceCounts()`. Original `reviewWeekWithOccurrences` remains the only authority for recording evidence, including distinct session IDs, Excel/manual completion preservation and date/provenance fields.

- No Scout names or raw evidence records are passed to Vue; only counts and conditional forecast points.
- Source-explicit and inferred occurrence metadata remain distinct; the app does not invent extra official requirements.
- The chart remains hypothetical and **never** writes Scout completions.
- `?forecastRenderer=legacy` preserves the previous forecast HTML.
- Multi-night camping evidence inside a single weekly block is still a documented limitation.

## Acceptance checklist
Verify 0/1/40/60 weeks, zero or subset of fictional Scouts, initial and projected values, identical trend points to legacy, exact repeated-opportunity deficits and count provenance, static dist and development rendering, desktop/mobile, no Scout writes on viewing/chart navigation. Leader review should record a distinct night only once, respect a source-complete Excel record and leave an incomplete multi-occurrence skill incomplete after first evidence. Run full Cub Pack workbook reimport privately before Phase 5.

**Validation status:** code proposed; automated and browser acceptance require execution.
