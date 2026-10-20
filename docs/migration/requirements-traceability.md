# Migration requirement traceability

The single source of truth for **all 118** application requirements is `data/application-requirements.json`, not this document. Every `APP-xxx` item already has an implementation path and a suggested verification. The migration checks now fail on duplicate IDs, bad category/status values, missing verification descriptions, or missing implementation files. The original 118 IDs are pinned in `docs/migration/baseline.json`.

| Category | Existing APP IDs | Primary migration owner | Verification track |
| --- | --- | --- | --- |
| Application/navigation | APP-001–APP-008 | Shell, routing, privacy and local state | B01–B05, B16–B18 |
| Excel onboarding | APP-009–APP-016 | Workbook compatibility adapter | B06 |
| Skills and trees | APP-017–APP-037 | Requirement domain, Skill Tree Mapper | B03, B07 |
| Scout evidence | APP-038–APP-045 | Progress, roster and session review | B04, B05, B08, B11 |
| Activity Studio | APP-046–APP-059 | Activity domain and editor | B10 |
| Scheduling | APP-060–APP-080 | Scheduler and forecast | B08, B09, B11, B12 |
| OAS coverage tracking | APP-081–APP-083 | Coverage tracker | B12 |
| Data/recovery | APP-084–APP-097 | Storage/import/export/recovery | B13, B14 |
| Help/documentation | APP-098–APP-104 | Help & Design | B02, B17 |
| Future discovery | APP-105–APP-118 | Out of this migration except approved APP-108 | No new feature acceptance implied |

**Classification boundary:** existing functionality must be preserved even where a status is `partial` or `planned`; the migration should not quietly treat future brainstorms as shipping feature requirements. APP-108 is the approved modular architecture task; its work is the migration itself.

**Testing depth:** Source-level traceability is automated. Browser verification remains a separate gate and must be recorded honestly. The current written register lists implementation references per individual APP item; do not duplicate an out-of-date 118-row document here.
