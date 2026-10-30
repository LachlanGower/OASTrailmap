'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('dist/index.html','utf8');
const preview=fs.readFileSync('dist/vue-preview.html','utf8');
for(const [name,body] of [['index',html],['vue-preview',preview]]){
 const scripts=[...body.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]);
 const bundled=scripts.filter(src=>src.includes('/assets/')&&src.endsWith('.js'));
 assert.ok(bundled.length>0,name+' missing bundled JS');
 assert.ok(bundled.every(src=>src.startsWith('/OASTrailmap/assets/')),name+' has incorrect GitHub Pages bundle base');
}
for(const dir of ['css','js','data','docs'])assert.ok(fs.statSync('dist/'+dir).isDirectory(),dir+' missing in subpath build');
console.log('GitHub Pages subpath build preserved legacy files and bundled assets.');
