/* Read-only byte-for-byte comparison between legacy source and Vite dist. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const required = ['index.html','css','js','data','docs'];

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
const preview=fs.readFileSync(path.join(root,'dist','vue-preview.html'),'utf8');
assert.ok(preview.includes('id="oas-vue-preview"'),'Vue entry missing from built output');
assert.ok(/assets\//.test(preview),'Vite did not bundle the Vue preview');
console.log('Vite build preserved '+count+' legacy files byte-for-byte; Vue preview bundled.');
