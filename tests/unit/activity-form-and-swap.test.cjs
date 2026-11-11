const {it}=require('node:test');
const assert=require('node:assert/strict');
const {activityForm,activityFromForm}=require('../../.phase3-test-dist/domain/activity-form.js');
const {swapScheduleWeeks}=require('../../.phase3-test-dist/domain/week-actions.js');
it('activity form retains hidden safety/review and custom fields without turning old arrays into strings',()=>{
 const original={id:'example',title:'Original',duration_minutes:45,tags:['Map'],covers:['req'],equipment:['map','compass'],instructions:['Find north','Follow route'],safety:'Historic note',review:{prompt:'Historic question'},custom:{provenance:true}};
 const before=JSON.stringify(original),form=activityForm(original);form.title='Updated name';form.duration=60;form.preparation='Set out maps';
 const saved=activityFromForm(original,form);
 assert.equal(saved.title,'Updated name');assert.equal(saved.duration_minutes,60);assert.equal(saved.duration,undefined);assert.deepEqual(saved.instructions,original.instructions);assert.deepEqual(saved.equipment,original.equipment);assert.equal(saved.preparation,'Set out maps');assert.equal(saved.safety,original.safety);assert.deepEqual(saved.review,original.review);assert.deepEqual(saved.custom,original.custom);assert.equal(JSON.stringify(original),before);
});
it('new activities use visible form fields and reject blank names and invalid durations',()=>{
 const original={id:'new',covers:[]},form=activityForm(original);form.title='Compass trail';form.duration=40;form.instructions='Walk to the marker';
 const saved=activityFromForm(original,form);assert.equal(saved.duration,40);assert.equal(saved.instructions,'Walk to the marker');assert.ok(!('safety' in saved));assert.ok(!('review' in saved));
 assert.throws(()=>activityFromForm(original,{...form,title:'   '}),/name/);assert.throws(()=>activityFromForm(original,{...form,duration:NaN}),/duration/);assert.throws(()=>activityFromForm(original,{...form,duration:0}),/duration/);
});
it('week swaps exchange complete plans and preserve all metadata without altering the input',()=>{
 const first={id:'week-a',requirementIds:['a'],theme:'Camp',activity:{filename:'camp.md'},suggestedRequirementIds:['a'],custom:{value:1}};
 const last={id:'week-c',requirementIds:['c'],theme:'Map',activityIds:['activity-c'],confirmedSession:true};
 const weeks=[first,{id:'week-b',requirementIds:['b']},last],before=JSON.stringify(weeks);
 const swapped=swapScheduleWeeks(weeks,0,2);assert.deepEqual(swapped,[last,weeks[1],first]);assert.equal(JSON.stringify(weeks),before);assert.deepEqual(swapScheduleWeeks(swapped,2,0),weeks);
});
it('week swaps reject locked plans, invalid positions and swapping a week with itself',()=>{
 const weeks=[{requirementIds:['a'],locked:true},{requirementIds:['b']}];
 assert.throws(()=>swapScheduleWeeks(weeks,0,1),/Unlock/);assert.throws(()=>swapScheduleWeeks(weeks,1,0),/Unlock/);
 for(const pair of [[-1,1],[1,7],[1,1],[.5,1]])assert.throws(()=>swapScheduleWeeks(weeks,...pair),/different existing/);
});
