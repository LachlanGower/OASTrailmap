# OAS Trailmap

A local-first single-page app prototype for Scout leaders to visualise Outdoor Adventure Skills (OAS) requirements, track individual progress, import the supplied Cub Pack workbook, and overlay activities.

## Run locally

Because the app fetches `data/requirements.json`, open it through a local static server rather than by double-clicking `index.html`:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000` (from this folder). The app uses SheetJS and js-yaml from public CDNs for Excel and YAML import; those features need an internet connection. The rest of the app uses vanilla JavaScript.

## Publish with GitHub Pages

1. Create a GitHub repository and upload the contents of this folder to its root.
2. In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`.
3. Save and wait for GitHub Pages to publish the site.

The public site contains the requirement map and example activity bank. Scout records are saved in the browser's `localStorage`; they are not uploaded or synchronised between leaders/devices. Use **Export backup** regularly. Restoring/importing data on a different browser requires the JSON backup file.

## Source data and IDs

- `data/requirements.yaml` is the editable human-friendly source structure.
- `data/requirements.json` is the browser-ready copy used by the app. Keep both in sync when editing requirements.
- Requirement wording is based on the supplied `OAS-Requirements.txt`.
- `data/activities.example.yaml` shows the supported activity format. Each activity's `covers` list accepts requirement IDs from the requirements data.

Stable IDs are generated from stage, stream and requirement wording. Avoid changing IDs once leaders have progress records. The current prerequisite arrays contain proposed learning/readiness dependencies that should be reviewed by the leadership team; they are not an authoritative Scouts Australia prerequisite list. Cross-stage topic links are advisory suggestions and never block completion.

## Workbook import behaviour

- Sheet names are expected to include Stage 1/2/3 and Camping/Bushwalking/Bushcraft.
- Scout names are discovered from the header row; roster differences between sheets are supported.
- A parseable date or a non-default filled cell is treated as completed.
- The preview lists rows whose text is not found in the source requirement data. Those workbook-only requirements are preserved as supplemental records rather than silently discarded.
- Import adds completion evidence and does not clear existing records. The source sheet, row and workflow label are retained with imported records.
- Plan/Do/Review/Verify are workflow labels from the workbook, not separate skills.

## Current prototype limitations

- No multi-device sync, user accounts, or server-side storage.
- The workbook style parser relies on cell fill metadata exposed by SheetJS; some Excel styles may not be represented in all workbook variants. Always inspect the import preview and verify the resulting progress.
- Inferred topic links are suggestions, not official prerequisite rules.
- Activity coverage is not evidence of completion.
- Importing the workbook is designed to preserve records, not to make blank cells clear previously recorded completion.

## Readiness colours, activity planner, and Scout subsets

- **Green**: the selected Scout has completed the requirement; in pack view, all imported Scouts have completed it.
- **Red**: one or more explicit prerequisites are not yet completed; in pack view, no remaining Scout is currently ready to work on it.
- **Yellow**: the requirement is available to work on at the selected Scout's current progress; in pack view, at least one Scout can work on it.
- **Missing requirements only**: select an individual Scout, then turn this on to hide completed requirements.
- **Planner mode**: choose one or more broad requirement tags (such as Food & cooking, Navigation, Scout Hall, or Outdoors / off-site). The planner counts unique matching requirements across all stages and streams, outstanding Scout-skill pairs, the number of Scouts affected, and the ready Scout-skill pairs. Multiple requirements can be planned for the same activity/night; overlapping tags do not double-count a requirement. The map focuses on the selected tags and shows how many Scouts are ready for each requirement.
- **Scout subsets**: use “Choose Scout subset” to select several Scouts and apply the map, summary, readiness counts, and planner only to that group. You can switch back to All Scouts or an individual Scout at any time.
- **Tags**: `data/requirements.yaml` and `data/requirements.json` include broad topic, stream, delivery-style, and venue tags. `Scout Hall`, `Outdoors / off-site`, and `External / real-world experience` are inferred planning suggestions based on the requirement wording, not official Scouts Australia classifications. Review them and adjust to suit your Unit.

The `tags` arrays are intended to help leaders bundle requirements into a practical activity; they are not a claim that every tagged requirement can be signed off in one session. The `prerequisites` arrays in `data/requirements.yaml` and `data/requirements.json` are conservative proposed learning/readiness dependencies. The supplied source does not provide an authoritative prerequisite graph, so review these proposed blockers with your leadership team before relying on them. `suggested_links` remain advisory cross-links and do not block progress.

## New prototype workspaces (October 2026)

Use the **Skill Tree Mapper** tab for custom tree assignment, node reordering (drag/drop), click-to-edit text/description/tags and mandatory or recommended prerequisite links. Stages remain reference metadata. The tree view draws solid green arrows for mandatory links within the visible tree and dashed gold lines for advisory links. Dependencies in other trees remain editable in the requirement editor, but do not draw cross-tree lines in the single-tree view. The editor rejects mandatory prerequisite cycles. Import and export `requirements.yaml`; the browser uses the imported data over the bundled defaults and validates IDs and mandatory dependencies. Creating and renaming trees and tag-library edits use the toolbar. The original requirement IDs must remain stable for Scout completions to continue matching.

The **40-week Scheduler** supports Scout progress first (selected Scouts or all) and Curriculum First, defaulting to 40 weeks and four distinct skills per week. It uses heuristic scores favouring uncompleted trunk skills with downstream dependents, Scout coverage, and related tags, and can schedule prerequisite plus dependent skills **in the same session**, in prerequisite-first order. The capacity can be adjusted for each week. Lock weeks to preserve them during regeneration; a preview displays the number of weeks changing before applying. Requirements can be edited in a week using IDs, and you can move a week earlier, select a theme, attach an activity file, or explicitly verify demonstrated skills for each Scout. A planned skill is never auto-completed. Sessions can be imported/exported as YAML (or JSON if the external YAML library is unavailable). Imports validate referenced IDs. No app backend is used.

Mapper state, snapshots (latest 20), and schedule live in a second localStorage key `oas-studio-v1`; Scout records and modified requirements live in `oas-trailmap-v1`. Browser storage is not a reliable sole backup: export `requirements.yaml`, `schedule.yaml` and the progress backup regularly. The progress backup doesn't include schedule or mapper snapshot history, so export the schedule separately. The current UI is a prototype: the scheduler uses heuristic, not optimal, allocation; uploaded activity files are stored as attachments but their contents are not semantically analysed; no cross-tree links are drawn; the site uses external CDN scripts for Excel and YAML parsing.

### Skill-tree mapper refinements

The mapper's **View tree or tag** selector includes both named user-defined trees and controlled-library tag views. A tag view overlays matching requirements from every tree, keeping their depth in the *global* mandatory-prerequisite graph. The diagram draws orthogonal arrows (solid green mandatory; dashed amber recommended); clicking a node emphasises its direct incoming/outgoing relationships and fades unrelated connections. Connections crossing outside the current tag/tree view remain editable in the requirement panel but are not drawn until both endpoints are visible. Dragging changes vertical order within the same prerequisite-depth column only, rather than changing the prerequisite graph.

The supplied requirements YAML and JSON now have some additional **proposed, non-official** learning prerequisites to show longer chains (up to five edges). These are planning suggestions and should be reviewed by leaders before being treated as blocking rules. As before, mandatory prerequisite skills and their dependent skills may be scheduled and demonstrated in the same session, in order.

### Mapper quick links and per-tree prerequisite graphs

Select one requirement card, then use the small **↑** icon on another card to **add that card as a mandatory parent of the selected requirement**, or **↓** to add it as a mandatory child. Icons appear only when a different requirement is selected. The app rejects mandatory-link cycles and keeps a safety snapshot for each change. A link can only be created from currently visible cards; the side editor remains available for cross-tree links. Selection and changes preserve the horizontal/vertical canvas scroll position where possible.

The **Links to edit** selector has two modes for named trees: **Master prerequisite tree** (the shared `requirements[].prerequisites` and `suggested_links` used by Scout readiness and the scheduler), or **This tree’s own links** (a local editable override for that tree, initially copied from the master for its requirements). Different named trees can have different override graphs without changing their master requirements. Tag views always show the master graph. In tree-specific mode, changed mandatory and recommended links are for visual/curriculum organisation only: they do *not* affect Scout readiness or scheduler priority. Requirement names, tags, and tree assignments are shared globally in both modes.

Tree graph overrides, tree names, and the tag library are included in the editor's **Export requirements.yaml** using `schema_version: 3` fields `tree_graphs`, `tree_registry`, and `tag_library`. Re-import restores those records, including custom/master modes. These fields are optional so earlier requirements YAML files still import. Local snapshot rollback also restores them. Note: the shipped `data/requirements.yaml` is the default master dataset; changes made in the browser must be explicitly exported to create an updated YAML file.
## Feature branch: Data & State Manager, locations and Activity Studio

The new **Data & State** workspace provides individual YAML/JSON dataset import/export, complete local backups, validation, change-count previews and local pre-import checkpoints. Original Scout progress is still seeded using the **Excel workbook** and existing highlighted-cell/date parser, with its familiar preview and merge semantics. Schedule and requirements imports do **not** reset Scout progress.

Requirements now support an optional `locations` object containing one preferred location and alternative acceptable locations. The Skill Tree Mapper edits these from a controlled location list. Existing records without locations default to flexible placement in the editor. Tags can be filtered directly from the Trailmap toolbar.

The **Activity Studio** builds structured plans (description, equipment, preparation, instructions, safety and review), suggests requirement coverage based on tags and compatible venues, and requires the leader to confirm the checkboxes. Activities never award completions automatically. Use Data & State to export or import `activities.yaml`.

The scheduler provides Scout progress, Curriculum First, Location-focused and Balanced options, plus preferred external venue weeks, a visual timeline and per-week Scout impact preview. Preferred weeks guide external-session suggestions but do not create a booking. Foundational and dependent requirements may still be scheduled in the same night.

**Caveats:** Location classifications are leader-editable proposals, not official OAS conditions; existing reference data is unchanged until explicitly edited. Scheduling is heuristic, not a guaranteed optimal 40-week curriculum. Changes on this branch have syntax-level checks but require end-to-end browser testing and sample workbook acceptance testing before merging.
