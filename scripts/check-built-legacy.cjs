/* Read-only byte-for-byte comparison between legacy source and Vite dist. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const required = ['css','js','data','docs'];

function files(relative) {
  const absolute = path.join(root, relative);
  if (fs.statSync(absolute).isDirectory()) {
    return fs.readdirSync(absolute).flatMap(name => files(path.join(relative,name)));
  }
  return [relative];
}

let count=0;
for(const base of required) {
 for(const relative of files(base)) {
  const original=fs.readFileSync(path.join(root, relative));
  const copied=fs.readFileSync(path.join(root,'dist',relative));
  const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
  assert.equal(digest(copied),digest(original),'Legacy build changed: '+relative);
  count++;
 }
}

const sourceHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
const builtHtml=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');
const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(ids(builtHtml),ids(sourceHtml),'Vite build changed static application DOM IDs');
const originalScripts=[
  ...JSON.parse(fs.readFileSync(path.join(root,'docs/migration/baseline.json'),'utf8')).script_sources
];
const outputScripts=[...builtHtml.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
for(const src of originalScripts) {
  assert.ok(outputScripts.includes(src), 'Vite build lost an original script: '+src);
}
assert.ok(/assets\/[^"\s]+\.js/.test(builtHtml),'Built app missing Vue island module');
assert.ok(!builtHtml.includes('src="/src/features/application-requirements/mount.ts"'),
  'Vite failed to compile the TypeScript app island');
const preview=fs.readFileSync(path.join(root,'dist','vue-preview.html'),'utf8');
assert.ok(preview.includes('id="oas-vue-preview"'),'Vue entry missing from built output');
assert.ok(/assets\//.test(preview),'Vite did not bundle the Vue preview');
console.log('Vite build preserved '+count+' legacy CSS/JS/data/docs files byte-for-byte; index DOM IDs and original scripts retained; Vue island and preview bundled.');
