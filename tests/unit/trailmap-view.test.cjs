'use strict';
const {describe,it} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {visibleTrailmapRequirements,trailmapSummary,normalizeSearch}
  =require('../../.phase3-test-dist/domain/trailmap-view.js');
const source=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../data/requirements.json'),'utf8')).requirements;
const [a,b]=source.slice(0,2);
const records={
  ['Example Scout::'+a.id]:{completed:true,date:'2026-01-01',source:'workbook'},
  ['Example Scout::'+b.id]:{completed:false},
  'Example Scout::__roster__':{completed:false}
};
const filters={stage:'all',stream:'all',status:'all',search:'',tag:'',
  missingOnly:false,plannerMode:false,selectedPlannerTags:[]};
describe('Phase 4C read-only Trailmap model (UI not yet replaced)',()=>{
  it('keeps the original 142 public skill references and scope summary',()=>{
    assert.equal(source.length,142);
    const summary=trailmapSummary(source,[],records,'Example Scout',[]);
    assert.equal(summary.totalRequirements,142);
    assert.equal(summary.completed,'1 / 142');
    assert.equal(summary.percentage,'1%');
    assert.equal(summary.nextCount,141);
    assert.equal(trailmapSummary(source,[],records,'__all__',[]).scopeNote,'Across all Scouts');
  });
  it('preserves legacy all-stage, stream, status and normalized search filters',()=>{
    assert.equal(visibleTrailmapRequirements(source,[],records,'__all__',[],filters).length,142);
    assert.equal(visibleTrailmapRequirements(source,[],records,'Example Scout',[],
      {...filters,status:'complete'}).length,1);
    assert.equal(visibleTrailmapRequirements(source,[],records,'Example Scout',[],
      {...filters,status:'outstanding'}).length,141);
    assert.equal(visibleTrailmapRequirements(source,[],records,'__all__',[],
      {...filters,stream:'not-a-stream'}).length,0);
    assert.equal(normalizeSearch('  Scout’s  Map!  '),'scout s map');
    assert.deepEqual(visibleTrailmapRequirements(source,[],records,'Example Scout',[],
      {...filters,search:a.text}).map(r=>r.id).includes(a.id),true);
  });
  it('keeps linked-activity and planner any-tag filtering isolated from progress',()=>{
    const activity=[{id:'fictional-activity',covers:[a.id],tags:[]}];
    assert.deepEqual(visibleTrailmapRequirements(source,activity,records,'Example Scout',[],
      {...filters,status:'activities'}).map(r=>r.id),[a.id]);
    const t=a.tags[0];
    assert.ok(t);
    const chosen=visibleTrailmapRequirements(source,activity,records,'Example Scout',[],
      {...filters,plannerMode:true,selectedPlannerTags:[t]});
    assert.ok(chosen.some(r=>r.id===a.id));
    assert.equal(records['Example Scout::'+a.id].completed,true,'Filtering cannot mutate Scout state');
  });
});
