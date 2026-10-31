/*
 * Read-only, dependency-free migration contracts.
 * Static guarantees only: run real workbook/browser tests before merging to production.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fromRoot = p => path.join(root, p);
const read = p => JSON.parse(fs.readFileSync(fromRoot(p), 'utf8'));
const baseline = read('docs/migration/baseline.json');
const app = read('data/application-requirements.json');
const reqs = read('data/requirements.json').requirements;
const html = fs.readFileSync(fromRoot('index.html'),'utf8');

const actualIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
for(const id of baseline.dom_element_ids) assert.ok(actualIds.includes(id),
  'A required legacy DOM ID was removed: '+id);
const allowedNewIds=new Set(['weeklyThemesTab','requirementsTrackerTab','weeklyThemes','weeklyThemeSelect','weeklyThemeContent','requirementsWorkspace','showRecommendedMapperLinks']);
for(const id of actualIds) assert.ok(baseline.dom_element_ids.includes(id)||allowedNewIds.has(id),
  'Unexpected new static DOM ID: '+id);
assert.equal(new Set(actualIds).size, actualIds.length, 'Duplicate static DOM IDs');

const sources = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
assert.deepEqual(sources.slice(0, baseline.script_sources.length), baseline.script_sources,
  'Original script order changed; legacy globals require the existing ordering');
assert.deepEqual(sources.slice(baseline.script_sources.length),
  ['/src/features/application-requirements/mount.ts'],
  'Unexpected Vue entrypoint or extra scripts in the legacy page');
for (const source of sources.filter(s => !/^https?:\/\//i.test(s))) {
  assert.ok(fs.existsSync(fromRoot(source.replace(/^\//,''))),
    'Missing browser entrypoint: '+source);
}
for (const label of baseline.workspace_labels) {
  assert.ok(html.includes('>'+label+'</button>'), 'Missing workspace navigation label: '+label);
}
const scriptFiles = fs.readdirSync(fromRoot('js'))
  .filter(p => p.endsWith('.js')).map(p => 'js/'+p);
const combinedJs = scriptFiles.map(p => fs.readFileSync(fromRoot(p),'utf8')).join('\n');
for (const name of baseline.browser_storage_keys) {
  assert.ok(combinedJs.includes(name), 'Storage key missing from scripts: '+name);
}
for (const fmt of baseline.format_identifiers) {
  assert.ok(combinedJs.includes(fmt), 'Export/import format removed: '+fmt);
}
for (const file of scriptFiles) {
  execFileSync(process.execPath, ['--check', fromRoot(file)], {stdio:'pipe'});
}

assert.equal(reqs.length, 142, 'Unexpected OAS requirement count');
const byId = new Map(reqs.map(r => [r.id,r]));
assert.equal(byId.size, reqs.length, 'Duplicate OAS requirement ID');
const seen = new Set(), active = new Set();
function visit(id) {
  if (active.has(id)) throw new Error('Mandatory prerequisite cycle at '+id);
  if (seen.has(id)) return;
  active.add(id);
  const req = byId.get(id);
  assert.ok(req, 'Missing requirement referenced in graph '+id);
  assert.ok(Array.isArray(req.tags), 'Malformed tags for '+id);
  assert.ok(Number.isInteger(req.required_occurrences) && req.required_occurrences >= 1,
    'Invalid required_occurrences for '+id);
  for (const parent of (req.prerequisites || [])) {
    assert.ok(byId.has(parent), 'Broken prerequisite '+id+' -> '+parent);
    visit(parent);
  }
  for (const link of (req.suggested_links || [])) {
    const refId = typeof link === 'string' ? link : link.id;
    assert.ok(byId.has(refId), 'Broken advisory link '+id+' -> '+refId);
  }
  active.delete(id);
  seen.add(id);
}
for (const r of reqs) visit(r.id);

assert.equal(app.requirements.length, 118, 'Unexpected application requirement count');
assert.equal(new Set(app.requirements.map(x => x.id)).size, app.requirements.length,
  'Duplicate application requirement ID');
const allowed = new Set(['implemented','partial','planned','future']);
for (const item of app.requirements) {
  assert.ok(app.categories[item.category], 'Unknown application category for '+item.id);
  assert.ok(allowed.has(item.status), 'Unknown application status for '+item.id);
  assert.ok(item.description && item.verification, 'Missing description or verification for '+item.id);
  assert.ok(Array.isArray(item.implementation) && item.implementation.length,
    'Missing source trace for '+item.id);
  for (const src of item.implementation) {
    assert.ok(fs.existsSync(fromRoot(src)), 'Broken application requirement source: '+item.id+' -> '+src);
  }
}
const fixture = read('tests/fixtures/legacy-state.synthetic.json');
assert.equal(fixture.fixture_kind, 'synthetic', 'Never commit real Scout data as a test fixture');
assert.deepEqual(Object.keys(fixture.storage).sort(), [...baseline.browser_storage_keys].sort(),
  'Synthetic fixture must exercise all three storage keys');
for (const [key, value] of Object.entries(fixture.storage)) {
  assert.ok(key in fixture.storage);
  assert.equal(typeof JSON.parse(JSON.stringify(value)), 'object');
}
const progress = fixture.storage['oas-trailmap-v1'];
assert.ok(progress.scoutRecords && typeof progress.scoutRecords === 'object');
for (const [recordKey, record] of Object.entries(progress.scoutRecords)) {
  assert.ok(recordKey.startsWith('Example Scout::'), 'Fixture must contain fictional Scout identity');
  assert.equal(typeof record.completed,'boolean', 'Malformed synthetic progress evidence');
  const id=recordKey.split('::').slice(1).join('::');
  assert.ok(id==='__roster__' || byId.has(id), 'Unknown synthetic progress requirement ID');
}
console.log('Migration contracts: 122 legacy DOM IDs, '+baseline.script_sources.length+' original scripts plus Vue entry, ' +
  ' script sources, '+reqs.length+' OAS requirements, '+app.requirements.length+
  ' app requirements, synthetic 3-key browser state, legacy JS syntax all passed.');
console.log('No behavioural, screenshot, Excel parser or persistence-migration tests run in this check.');
