const {it}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const XLSX=require('xlsx');
const app=require('../../.phase3-test-dist/services/application-state.js');
const files=require('../../.phase3-test-dist/services/data-files.js');
const progress=require('../../.phase3-test-dist/domain/progress.js');
const {generateSchedule}=require('../../.phase3-test-dist/domain/schedule-engine.js');
const {parseCubWorkbook}=require('../../.phase3-test-dist/features/workbook/workbook-parser.js');
const requirements=require('../../data/requirements.json').requirements;
const fixture=require('../fixtures/legacy-state.synthetic.json').storage;
const keys={progress:'oas-trailmap-v1',studio:'oas-studio-v1',checkpoints:'oas-data-checkpoints-v1'};
function storage(){const data=new Map(Object.entries(fixture).map(([k,v])=>[k,JSON.stringify(v)]));return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
it('loads without writes and retains evidence plus unknown metadata when editing and reloading',()=>{
 const port=storage(),before=[...port.data];const state=app.loadApplication(port,requirements);assert.deepEqual([...port.data],before);
 state.progress.custom={preserve:true};state.studio.extra={positions:[3,4]};const next=app.clone(state);next.studio.capacity=6;
 const saved=app.persistApplication(port,next,state,'Edit');const reloaded=app.loadApplication(port,requirements);
 assert.deepEqual(reloaded.progress.scoutRecords,state.progress.scoutRecords);assert.deepEqual(reloaded.progress.custom,{preserve:true});assert.deepEqual(reloaded.studio.extra,{positions:[3,4]});assert.equal(reloaded.studio.capacity,6);assert.equal(saved.progress.requirementsOverride.length,142);
 const checkpoints=JSON.parse(port.getItem(keys.checkpoints));assert.equal(checkpoints[0].title,'Edit');assert.deepEqual(checkpoints[0].payload.scoutRecords,state.progress.scoutRecords);
});
it('corrupt data and checkpoint quota failures leave progress and studio bytes untouched',()=>{
 const port=storage();port.data.set(keys.progress,'broken JSON');const before=[...port.data];assert.throws(()=>app.loadApplication(port,requirements),/Cannot parse/);assert.deepEqual([...port.data],before);
 const good=storage(),state=app.loadApplication(good,requirements),original=[...good.data];good.setItem=()=>{throw Error('Quota exceeded');};assert.throws(()=>app.persistApplication(good,state,state,'blocked'),/Quota/);assert.deepEqual([...good.data],original);
});
it('rolls back progress if the second data-key write fails; checkpoint remains available',()=>{
 const port=storage(),state=app.loadApplication(port,requirements),beforeProgress=port.getItem(keys.progress),beforeStudio=port.getItem(keys.studio),next=app.clone(state);next.progress.scoutRecords['Synthetic Scout::__roster__']={completed:false};
 const original=port.setItem;let failed=false;port.setItem=(k,v)=>{if(k===keys.studio&&!failed){failed=true;throw Error('Studio write failed');}original(k,v);};
 assert.throws(()=>app.persistApplication(port,next,state,'rollback'),/Studio write failed/);assert.equal(port.getItem(keys.progress),beforeProgress);assert.equal(port.getItem(keys.studio),beforeStudio);assert.ok(JSON.parse(port.getItem(keys.checkpoints))[0].payload);
});
it('round-trips all six datasets through JSON and YAML and four tabular datasets through OAS CSV',()=>{
 const state=app.loadApplication(storage(),requirements);
 state.studio.schedule=[{id:'week-1',requirementIds:[requirements[0].id],locked:true,activity:{filename:'synthetic.md'}}];
 for(const kind of ['full','requirements','progress','activities','schedule','trees'])for(const format of ['json','yaml','csv']){
  const bundle=app.exportApplication(state,kind);if(format==='csv'&&['full','trees'].includes(kind)){assert.throws(()=>files.encodeFile(kind,bundle,format),/JSON or YAML/);continue;}
  // The fixture has one existing schedule week, satisfying the import envelope.
  const encoded=files.encodeFile(kind,bundle,format),decoded=files.decodeFile(kind,encoded,'data.'+format);
  assert.deepEqual(decoded,bundle,kind+' '+format);const next=app.applyDataset(state,kind,decoded);assert.deepEqual(next.progress.scoutRecords,state.progress.scoutRecords);
 }
});
it('real XLSX bytes retain dates, roster entries, manual evidence and workbook-only IDs on apply',()=>{
 const state=app.loadApplication(storage(),requirements),r=requirements.find(r=>r.stage===1&&r.stream==='Camping');
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['','', 'Synthetic Scout A','Synthetic Scout B'],['Do',r.text,'15/01/2026',''],['Do','Workbook-only synthetic skill','16/01/2026','']]),'Stage 1 Camping');
 const decoded=XLSX.read(XLSX.write(wb,{type:'buffer',bookType:'xlsx'}),{type:'buffer',cellDates:true,cellStyles:true});
 const preview=parseCubWorkbook(decoded,XLSX,requirements),next=app.applyWorkbook(state,preview);
 assert.equal(preview.scouts.length,2);assert.equal(preview.rows.length,2);assert.equal(preview.extraReqs.length,1);assert.equal(next.progress.scoutRecords['Synthetic Scout A::'+r.id].date,'2026-01-15');assert.equal(next.progress.scoutRecords['Synthetic Scout A::'+r.id].sourceRow,2);assert.equal(next.progress.scoutRecords['Synthetic Scout B::__roster__'].completed,false);for(const [key,value] of Object.entries(state.progress.scoutRecords))assert.deepEqual(next.progress.scoutRecords[key],value);
 assert.equal(next.requirements.length,143);assert.deepEqual(state.requirements,requirements);assert.equal(Object.keys(state.progress.scoutRecords).length,Object.keys(fixture[keys.progress].scoutRecords).length);
});
it('Stage 1 readiness ignores prerequisite metadata while earned evidence remains authoritative',()=>{
 const r={...requirements[0],stage:1,prerequisites:['unknown']};assert.equal(progress.requirementStatus(r,'Synthetic Scout',['Synthetic Scout'],[r],{}),'ready');assert.equal(progress.requirementStatus(r,'Synthetic Scout',['Synthetic Scout'],[r],{['Synthetic Scout::'+r.id]:{completed:true}}),'complete');
});
it('matches PR #40 scheduler scoring for every strategy, mixed readiness, locations and locked metadata',()=>{
 const source=fs.readFileSync('js/studio.js','utf8');const legacy=source.slice(source.indexOf('function buildSchedule('),source.indexOf('function saveSchedule('));
 const records={'A::__roster__':{completed:false},'B::__roster__':{completed:false}};requirements.slice(0,12).forEach(r=>records['A::'+r.id]={completed:true});
 for(const strategy of ['progress','curriculum','location','balanced'])for(const useLocations of [false,true])for(const selected of [[],['A'],['A','B']]){
  const studio={strategy,useLocations,allowedLocations:[],weeks:8,capacity:4,schedule:[{id:'locked',locked:true,capacity:2,stageLimit:1,requirementIds:[requirements[0].id],activity:{filename:'retained.md'},custom:true}]};
  const context={requirements,studio,structuredClone,Set,Map,scope:selected,scheduleScope:()=>strategy==='curriculum'?[]:selected,isCompleted:(s,id)=>progress.isCompleted(records,s,id),byId:id=>requirements.find(r=>r.id===id),uniq:x=>[...new Set(x)],orderSession:ids=>require('../../.phase3-test-dist/domain/scheduling.js').orderSession(ids,requirements),descendantsCount:id=>{const found=new Set(),todo=[id];while(todo.length){const x=todo.pop();for(const r of requirements)if(r.prerequisites.includes(x)&&!found.has(r.id)){found.add(r.id);todo.push(r.id);}}return found.size;}};
  const expected=vm.runInNewContext(legacy+';buildSchedule(true)',context),before=JSON.stringify({requirements,records,studio});
  assert.deepEqual(generateSchedule(requirements,records,studio,selected,true),JSON.parse(JSON.stringify(expected)),strategy+' '+useLocations+' '+selected);assert.equal(JSON.stringify({requirements,records,studio}),before);
 }
});
it('rejects dropping a locked week when shortening the plan',()=>{
 assert.throws(()=>generateSchedule(requirements,{}, {weeks:1,capacity:4,schedule:[{requirementIds:[]},{locked:true,requirementIds:[]}]},[],true),/locked week/);
});
