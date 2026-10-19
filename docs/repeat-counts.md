# Occurrence-count assumptions and source wording

**Status:** Planning metadata for OAS Trailmap; not an authoritative interpretation of the OAS award requirements.

The original requirement sentences in `data/requirements.json` and `data/requirements.yaml` are preserved. An annotated review-friendly copy is in `data/requirements.txt`. Every item has a planning count (default: **one**), a count unit and a basis.

## Explicit multiple experiences
- Stage 3 Camping: spent **5 nights** camping in a tent — plan 5 distinct nights.
- Stage 3 Bushwalking: attended **at least two** bushwalking activities — plan 2.
- Stage 2 Camping: spent **two nights** camping in a tent — plan 2.
- Stage 2 Camping: discussed learning from **at least two camps** — plan for two separate camp experiences; the discussion can follow the second.
- Stage 2 Bushwalking: attended **at least two** short bushwalks — plan 2.
- Stage 2 Bushwalking: reviewed learning from **at least two bushwalks** — plan for two distinct walks; one discussion may cover both.
- Stage 2 Bushcraft: reviewed learning from **at least two bushcraft activities** — plan 2 experiences; discussion may happen after them.
- Stage 1 Camping: spent **two nights** camping or at Scout sleepovers — plan 2.

## Inferred multiple experiences
- Stage 2 Bushwalking: total distance of at least **10 km** — *estimate* 2 walks as a convenient planning breakdown. **One sufficiently long bushwalk could also satisfy this distance**; the planning count can be edited.

## Other requirements

One distinct planned evidence opportunity is the default, not a claim that one session always fulfils every task. Numbers such as *learn 3 knots*, *five knots* or *identify three constellations* refer to the number of items to demonstrate, **not** the number of separate nights.

## Scout progress compatibility

Existing Excel-imported or manually completed records stay complete and count as fully satisfied. New leader reviews can record partial evidence using distinct `sessionEvidence` identifiers before reaching the target. Regenerating a schedule never automatically marks a requirement complete.
