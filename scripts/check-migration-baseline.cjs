// Static migration baseline check. No dependencies, no personal Scout data.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const baseline = read('docs/migration/baseline.json');
const oas = read('data/requirements.json').requirements;
const app = read('data/application-requirements.json').requirements;
assert.equal(oas.length, baseline.oas_requirement_count, 'OAS requirement count drift');
assert.equal(app.length, baseline.application_requirement_count, 'Application requirement count drift');
assert.deepEqual(oas.map(({id,text,stage,stream})=>({id,text,stage,stream})), baseline.oas_requirements, 'OAS requirement identity, ordering, text or stage drift');
assert.deepEqual(app.map(({id})=>id), baseline.application_requirement_ids, 'Application requirement IDs/order drift');
assert.equal(new Set(oas.map(x=>x.id)).size, oas.length, 'Duplicate OAS requirement IDs');
assert.equal(new Set(app.map(x=>x.id)).size, app.length, 'Duplicate application requirement IDs');
const ids = new Set(oas.map(x=>x.id));
for (const r of oas) {
  assert.ok(r.text && typeof r.text === 'string', 'Missing OAS requirement text '+r.id);
  for (const p of (r.prerequisites || [])) assert.ok(ids.has(p), 'Broken prerequisite '+r.id+' → '+p);
}
for (const f of baseline.legacy_entrypoints) assert.ok(fs.existsSync(path.join(root,f)), 'Missing legacy entrypoint '+f);
const js = fs.readdirSync(path.join(root,'js')).filter(n=>n.endsWith('.js')).map(n=>fs.readFileSync(path.join(root,'js',n),'utf8')).join('\n');
for (const k of baseline.browser_storage_keys) assert.ok(js.includes(k), 'Missing legacy storage key '+k);
console.log('Baseline structural check passed: '+oas.length+' OAS requirements, '+app.length+' application requirements; entrypoints/storage preserved.');
console.log('Note: this does not constitute browser, visual, workbook or data-migration acceptance testing.');
