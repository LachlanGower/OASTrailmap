/* Readable in-app documentation, workflow diagrams, and repeat-night reference notes. */
const revisedNightTopic=HELP_TOPICS.find(x=>x.id==='nights');
if(revisedNightTopic)revisedNightTopic.text='1. Import your original Excel progress workbook in Data & State.\n2. Choose the Scouts you want to plan for.\n3. Select Progress, Location or Balanced and generate the 40-week schedule.\n4. Open each week to inspect forecasted progress and requirements that need repeat sessions.\n5. Use Swap similar beside a planned skill to see suitable alternatives. A swap locks its week so regeneration preserves the change.\n6. Review suggested Activity Studio combinations, adjust order, and confirm the night plan.\n7. After the session, open Review skills and record evidence. Skills needing multiple nights finish only when their count is met.';
const schedulingTopic=HELP_TOPICS.find(x=>x.id==='scheduling');
if(schedulingTopic)schedulingTopic.text='The scheduler proposes opportunities; it never certifies a Scout. Progress-focused favours readiness and downstream unlocks. Location-focused favours grouping compatible skills at the same venue. Balanced considers both.\n\nForecasts: the line chart estimates average fully completed requirements per selected Scout, assuming attendance, all scheduled skill evidence, successful prerequisites and leader verification. It is not actual progress.\n\nRepeat requirements: source-defined numeric counts are labelled explicit; default and contextual planning estimates are inferred. Each scheduled week counts at most once per requirement. Multiple distinct nights are needed when the required count is greater than one.\n\nSwaps: Swap similar ranks replacement candidates by tags, stream, venue and readiness. The edited week locks automatically to protect the leader choice.';
HELP_TOPICS.push(
 {id:'repeat',group:'Everyday workflows',title:'Requirements needing several nights',text:'Some skills require more than one experience, such as two bushwalking activities or five nights camping. OAS Trailmap stores a planning count for each requirement. A repeated requirement may appear in several different weeks. The same week never counts twice.\n\nThe source text provides explicit numbers for eight multi-night items. One cumulative-distance goal uses an inferred two-walk planning estimate. All other requirements default to one opportunity; this does not guarantee completion. Leaders can adjust the required count in Skill Tree Mapper.\n\nLeader review records evidence separately for each week. A requirement is completed only after enough distinct evidence opportunities have been reviewed. Previously imported Excel completions remain fully completed.'},
 {id:'forecast',group:'Workflows & design',title:'Reading the forecast progress graph',text:'The progress graph starts with the completion records already imported from Excel or recorded manually. It then estimates how many unique requirements Scouts might complete if they attend the planned weeks and demonstrate every scheduled requirement.\n\nRequirements with repeat counts increase the graph only after their final needed session. Prerequisites must also be met. The graph is an estimate, not a promise or an automatic award.\n\nUse Swap similar to replace a requirement in a night with a related one. Check the updated forecast and any warnings about unmatched prerequisites or repeat-session shortfalls.'}
);
const HELP_GRAPH_STEPS={
 start:['Original Excel workbook','Review & import progress','Choose Scouts','Build week plan','Review activity evidence'],
 excel:['Original workbook','Detect highlighted/date cells','Preview Scout matches','Confirm import','Preserve completion history'],
 scouts:['Plan opportunities','Deliver Scout night','Leader reviews evidence','Update actual progress'],
 activities:['Write activity plan','Choose tags & location','Suggest coverage','Leader confirms matches','Library available to scheduler'],
 nights:['Read Scout readiness','Generate weeks','Forecast progress','Swap / group activities','Confirm & review'],
 scheduling:['Scout progress + prerequisites','Scheduling strategy','Week requirements','Repeat-night checks','Conditional forecast'],
 forecast:['Actual Scout progress','Planned evidence per week','Count repeated nights','Check prerequisites','Projected completions'],
 repeat:['Source requirement wording','Explicit or estimated count','Several different weeks','Leader evidence per night','Requirement complete'],
 state:['Browser-only saved data','Choose full or partial export','Download backup','Restore with preview'],
 reset:['Select dataset','Download backup','Review action','Confirm reset','Import original workbook if needed'],
 trees:['Select tree','Select requirement','Edit prerequisite links','Set evidence count','Save locally'],
 appendix:['Shared requirements and activities','Local roster, progress and schedules','Selective exports / backups'],
 future:['Brainstorm ideas','Discuss leader needs','Check privacy and feasibility','Agree acceptance criteria','Approve a future release'],
 trouble:['Identify problem','Open relevant help topic','Review import or schedule','Restore backup if needed']
};
function docsDiagram(id){
 const stages=HELP_GRAPH_STEPS[id];if(!stages)return '';
 return '<section class="docs-diagram" aria-label="Workflow: '+esc(stages.join(' then '))+'"><h4>Workflow at a glance</h4><div class="docs-flow" role="list">'+stages.map((s,i)=>
 '<div class="docs-flow-unit" role="listitem"><div class="docs-flow-node"><span class="docs-step">'+(i+1)+'</span><span>'+esc(s)+'</span></div>'+(i<stages.length-1?'<span class="docs-arrow" aria-hidden="true">→</span>':'')+'</div>'
 ).join('')+'</div></section>';
}
function docsFormat(text,id){
 const paragraph=str=>'<p>'+esc(str.trim())+'</p>';
 const blocks=text.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
 return blocks.map(block=>{
  const enumerated=block.match(/^(?:\d+\.\s)/);
  if(enumerated){
   const parts=block.includes('\n')?block.split(/\n(?=\d+\.\s)/):block.split(/ (?=\d+\.\s)/);
   return '<ol class="docs-steps">'+parts.map(p=>'<li>'+esc(p.replace(/^\d+\.\s*/,''))+'</li>').join('')+'</ol>';
  }
  if(block.includes('\n• ')){
   const rows=block.split('\n').filter(Boolean),intro=rows.filter(x=>!x.trim().startsWith('•')),bullets=rows.filter(x=>x.trim().startsWith('•'));
   return intro.map(paragraph).join('')+'<ul>'+bullets.map(b=>'<li>'+esc(b.trim().replace(/^•\s*/,''))+'</li>').join('')+'</ul>';
  }
  return block.split('\n').map(paragraph).join('');
 }).join('')+
 (id==='appendix'?'<p class="tiny muted">Editable planning counts are stored in <code>required_occurrences</code>, with <code>occurrence_basis</code> recording whether the count was explicit, inferred or leader-reviewed. See <code>data/requirements.txt</code> for the annotated reference.</p>':'')+
 (id==='future'?'<p><strong>Nothing in this section is approved for implementation.</strong> The next step is requirements discovery, not an automatic development commitment.</p>':'');
}
helpOpen=function(id){
 const target=HELP_TOPICS.find(t=>t.id===id),box=$('#helpContent');if(!box)return;
 if(!target){box.innerHTML='';return;}
 box.innerHTML='<article class="docs-article" data-help-open="'+esc(id)+'"><p class="eyebrow">'+esc(target.group)+'</p><h3>'+esc(target.title)+'</h3>'+docsDiagram(id)+docsFormat(target.text,id)+'</article>';
};

