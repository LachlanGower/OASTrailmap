'use strict';
const {describe,it} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');

const req = require('../../.phase3-test-dist/domain/requirements.js');
const progress = require('../../.phase3-test-dist/domain/progress.js');
const schedule = require('../../.phase3-test-dist/domain/scheduling.js');
const state = require('../../.phase3-test-dist/services/legacy-state.js');
const imports = require('../../.phase3-test-dist/services/import-validation.js');

const fixture = JSON.parse(readFileSync(path.resolve(__dirname,'../../tests/fixtures/legacy-state.synthetic.json'),'utf8'));
const dataset = JSON.parse(readFileSync(path.resolve(__dirname,'../../data/requirements.json'),'utf8'));
const A = {id:'A',stage:1,stream:'Camping',text:'Prepare',tags:['camp','group'],prerequisites:[]};
const B = {id:'B',stage:1,stream:'Camping',text:'Practice',tags:['camp'],prerequisites:['A']};
const C = {id:'C',stage:2,stream:'Bushwalking',text:'Review',tags:[],prerequisites:['B']};
const graph=[A,B,C];
const record=(completed,extras={})=>({completed,...extras});

describe('canonical requirements: identity and safe validation',()=>{
  it('loads the original 142 requirement records without replacing IDs or source wording',()=>{
    const result=req.parseRequirementsData(dataset);
    assert.equal(result.requirements.length,142);
    assert.strictEqual(result.requirements,dataset.requirements);
    assert.deepEqual(result.requirements.map(r=>[r.id,r.text]), dataset.requirements.map(r=>[r.id,r.text]));
  });
  it('rejects duplicates, dangling edges, cycles, malformed tags and advisory references',()=>{
    assert.throws(()=>req.validateRequirements([A,A]),/duplicated/);
    assert.throws(()=>req.validateRequirements([{...B,prerequisites:['missing']}]),/Missing prerequisite/);
    assert.throws(()=>req.validateRequirements([{...A,prerequisites:['B']},B]),/Circular/);
    assert.throws(()=>req.validateRequirements([{...A,tags:'bad'}]),/Malformed/);
    assert.throws(()=>req.validateRequirements([{...A,suggested_links:[{id:'missing'}]}]),/advisory/);
  });
  it('keeps tag selection as any-match and preserves source order',()=>{
    assert.deepEqual(req.selectByAnyTag(graph,['group']).map(x=>x.id),['A']);
    assert.deepEqual(req.selectByAnyTag(graph,['camp']).map(x=>x.id),['A','B']);
    assert.deepEqual(req.selectByAnyTag(graph,[]),[]);
    assert.deepEqual(req.allTags(graph),['camp','group']);
  });
});

describe('Scout progress matches app.js and forecast.js',()=>{
  it('preserves Scout::ID keys and legacy fictional roster conventions',()=>{
    const records={
      'Test Scout::A':record(true), 'Test Scout::__roster__':record(false),
      'Second Scout::B':record(false)
    };
    assert.equal(progress.progressKey('Test Scout','A'),'Test Scout::A');
    assert.deepEqual(progress.scoutNames(records),['Second Scout','Test Scout']);
    assert.deepEqual(progress.scopedScoutNames(records,'__all__'),['Second Scout','Test Scout']);
    assert.deepEqual(progress.scopedScoutNames(records,'__subset__',['Test Scout','Missing']),['Test Scout']);
    assert.deepEqual(progress.scopedScoutNames(records,'Test Scout'),['Test Scout']);
    assert.deepEqual(progress.scopedScoutNames(records,'Missing'),[]);
  });
  it('keeps single and group readiness exactly as the current application',()=>{
    const records={
      'Ready Scout::A':record(true),
      'Ready Scout::B':record(false),
      'Done Scout::A':record(true),
      'Done Scout::B':record(true),
      'Blocked Scout::A':record(false)
    };
    const names=['Ready Scout','Blocked Scout','Done Scout'];
    assert.deepEqual(progress.blockedPrerequisites(B,'Blocked Scout',graph,records),['A']);
    assert.equal(progress.requirementStatus(B,'Ready Scout',['Ready Scout'],graph,records),'ready');
    assert.equal(progress.requirementStatus(B,'Blocked Scout',['Blocked Scout'],graph,records),'blocked');
    assert.equal(progress.requirementStatus(B,'Done Scout',['Done Scout'],graph,records),'complete');
    assert.equal(progress.requirementStatus(B,'__all__',names,graph,records),'ready');
    assert.equal(progress.requirementStatus(B,'__all__',['Done Scout'],graph,records),'complete');
    assert.equal(progress.requirementStatus(B,'__subset__',[],graph,records),'ready');
    assert.equal(progress.readyScoutCount(B,names,graph,records),1);
    assert.deepEqual(progress.recordFor(records,'Nobody','C'),
      {completed:false,date:'',source:'manual'});
  });
  it('treats existing Excel completions as final even with multiple required sessions',()=>{
    const repeated={...B,required_occurrences:5};
    assert.equal(progress.requiredTimes(repeated),5);
    assert.equal(progress.occurrenceState(record(true,{source:'workbook'}),repeated),5);
    assert.equal(progress.occurrenceState(record(false,{sessionEvidence:['week-1','week-1','week-3']}),repeated),2);
    assert.equal(progress.occurrenceState(record(false,{occurrences:3}),repeated),3);
    assert.equal(progress.occurrenceState(record(false,{occurrences:12}),repeated),5);
    assert.equal(progress.requiredTimes({...B,required_occurrences:41}),1);
  });
});

describe('scheduler compatibility utilities',()=>{
  it('orders prerequisites first and retains requested ordering where possible',()=>{
    assert.deepEqual(schedule.orderSession(['C','B','A'],graph),['A','B','C']);
    assert.deepEqual(schedule.orderSession(['C','A'],graph),['C','A']); // B absent; legacy behaviour
    assert.deepEqual(schedule.orderSession(['A','A','B'],graph),['A','B']);
  });
  it('counts separate weeks but not duplicates within a single night',()=>{
    const counts=schedule.scheduleOccurrenceCounts([
      {requirementIds:['A','A','B']},{requirementIds:['A']},{requirementIds:['B','B']}
    ]);
    assert.equal(counts.get('A'),2);
    assert.equal(counts.get('B'),2);
  });
  it('validates 1–60 week envelope and referenced OAS IDs',()=>{
    assert.doesNotThrow(()=>schedule.validateScheduleWeeks([{requirementIds:['A']}],graph));
    assert.throws(()=>schedule.validateScheduleWeeks([],graph),/1–60/);
    assert.throws(()=>schedule.validateScheduleWeeks(Array.from({length:61},()=>({requirementIds:[]})),graph),/1–60/);
    assert.throws(()=>schedule.validateScheduleWeeks([{requirementIds:['UNKNOWN']}],graph),/unknown requirement/i);
  });
});

describe('localStorage compatibility adapter: read-only by default',()=>{
  function port(items={}) {
    const map=new Map(Object.entries(items));
    return {
      writes:[],
      getItem(key){return map.has(key)?map.get(key):null;},
      setItem(key,value){this.writes.push([key,value]);map.set(key,value);}
    };
  }
  it('reads all three actual storage keys without modifying bytes',()=>{
    const raw=Object.fromEntries(Object.entries(fixture.storage).map(([k,v])=>[k,JSON.stringify(v)]));
    const storage=port(raw);
    const parsed=state.readLegacySnapshot(storage);
    assert.equal(parsed.progress.scoutRecords['Example Scout::__roster__'].completed,false);
    assert.equal(parsed.studio.strategy,'progress');
    assert.deepEqual(parsed.checkpoints,[]);
    assert.deepEqual(storage.writes,[]);
    assert.deepEqual(Object.fromEntries([...Object.keys(raw)].map(k=>[k,storage.getItem(k)])),raw);
  });
  it('keeps additional/unknown user data and does not write on read',()=>{
    const s=port({'oas-trailmap-v1':JSON.stringify({version:1,scoutRecords:{},customSetting:42})});
    const read=state.readLegacySnapshot(s);
    assert.equal(read.progress.customSetting,42);
    const next=state.makeLegacyProgressPayload({previous:read.progress,scoutRecords:{},activities:[],requirements:graph});
    assert.equal(next.customSetting,42);
    assert.equal(next.version,1);
    assert.deepEqual(s.writes,[]);
    state.writeLegacyProgress(s,next);
    assert.equal(s.writes.length,1);
    assert.equal(s.writes[0][0],'oas-trailmap-v1');
    assert.equal(JSON.parse(s.writes[0][1]).customSetting,42);
  });
  it('does not silently erase corrupt progress, unreadable storage or invalid writes',()=>{
    const bad=port({'oas-trailmap-v1':'{corrupted'});
    assert.throws(()=>state.readLegacySnapshot(bad),/records were not changed/);
    assert.equal(bad.getItem('oas-trailmap-v1'),'{corrupted');
    assert.equal(bad.writes.length,0);
    const blocked={getItem(){throw new Error('blocked');}};
    assert.throws(()=>state.readLegacySnapshot(blocked),/Could not read/);
    assert.throws(()=>state.writeLegacyProgress({setItem(){throw new Error('quota');}}, {scoutRecords:{}}),/Could not save/);
    assert.throws(()=>state.parseProgress({scoutRecords:{broken:{completed:false}}}),/Invalid progress record/);
  });
  it('treats fresh browser storage as absent rather than auto-initialising keys',()=>{
    const s=port();
    assert.deepEqual(state.readLegacySnapshot(s),{progress:null,studio:null,checkpoints:null});
    assert.deepEqual(s.writes,[]);
  });
});

describe('import schemas do not change or apply incoming data',()=>{
  it('validates current schedule and progress exports without altering their source object',()=>{
    const scheduled={format:'oas-trailmap-schedule',schema_version:1,weeks:[{requirementIds:['A']}],custom:4};
    assert.strictEqual(imports.validateImportPayload('schedule',scheduled,graph),scheduled);
    const saved={format:'oas-trailmap-progress',scoutRecords:{'Example Scout::A':record(true)}};
    assert.strictEqual(imports.validateImportPayload('progress',saved,graph),saved);
  });
  it('rejects duplicate activity IDs, unknown requirements and malformed progress records',()=>{
    const make=(id,covers)=>({id,covers});
    assert.throws(()=>imports.validateImportPayload('activities',{activities:[make('x',['A']),make('x',['B'])]},graph),/repeated/);
    assert.throws(()=>imports.validateImportPayload('activities',{activities:[make('x',['missing'])]},graph),/Unknown requirement/);
    assert.throws(()=>imports.validateImportPayload('progress',{scoutRecords:{'Bad::A':{completed:'yes'}}},graph),/Invalid progress/);
  });
  it('accepts old complete backups, and keeps all fields untouched for future import previews',()=>{
    const example={format:'oas-trailmap-backup',version:1,requirements:graph,
      scoutRecords:{'Example Scout::A':record(true)},activities:[],customExtra:{keep:true}};
    assert.strictEqual(imports.validateImportPayload('full',example,graph),example);
    assert.deepEqual(example.customExtra,{keep:true});
    assert.throws(()=>imports.validateImportPayload('full',{...example,format:'other'},graph),/Not an OAS backup/);
  });
});
