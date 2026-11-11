<script setup lang="ts">
import { computed,ref } from 'vue';
import type { OasRequirement,ScoutRecord } from '../domain/models';
import { change,state,scope,ui } from '../state';
import { recordFor,requiredTimes,occurrenceState } from '../domain/progress';
import { planningLocations } from '../domain/planning-locations';
import { validateRequirements } from '../domain/requirements';
const props=defineProps<{requirement:OasRequirement}>();
const hideComplete=ref(false),editing=ref(false),text=ref('');
const target=computed(()=>requiredTimes(props.requirement));
const themes=computed(()=>[...new Set((props.requirement.theme_tags as string[]|undefined)??props.requirement.tags)]);
const otherTags=computed(()=>props.requirement.tags.filter(tag=>!themes.value.includes(tag)));
const scouts=computed(()=>scope.value.filter(s=>!hideComplete.value||!record(s).completed));
const activities=computed(()=>state.value!.progress.activities?.filter(a=>a.covers.includes(props.requirement.id))??[]);
const prerequisites=computed(()=>props.requirement.stage===1?[]:props.requirement.prerequisites);
const requirementName=(id:string)=>state.value!.requirements.find(r=>r.id===id)?.text??id;
function record(scout:string):ScoutRecord{return recordFor(state.value!.progress.scoutRecords,scout,props.requirement.id);}
function sourceLabel(scout:string):string{if(!state.value!.progress.scoutRecords[scout+'::'+props.requirement.id])return 'No evidence recorded';const source=record(scout).source;return source==='workbook'?'Workbook import':source==='manual'?'Leader recorded':String(source||'No evidence recorded');}
function complete(scout:string,value:boolean){change('Before completion change',s=>{const key=scout+'::'+props.requirement.id;s.progress.scoutRecords[key]={...recordFor(s.progress.scoutRecords,scout,props.requirement.id),completed:value,date:value?new Date().toISOString().slice(0,10):'',source:'manual'};});}
function save(){try{const next=JSON.parse(text.value) as OasRequirement;if(next.id!==props.requirement.id)throw new Error('Existing requirement IDs cannot be changed.');if(change('Before requirement edit',s=>{s.requirements=s.requirements.map(r=>r.id===next.id?next:r);validateRequirements(s.requirements);})){editing.value=false;}}catch(e){ui.error=String(e);}}
</script>
<template>
 <aside class="detail" aria-labelledby="oas-statement-title">
  <div class="detail-header"><h2 id="oas-statement-title">OAS Statement</h2><button class="close" aria-label="Close requirement details" @click="ui.requirementId=''">×</button></div>
  <div class="detail-content">
   <h3 class="statement-name">{{requirement.text}}</h3>
   <p class="statement-subtitle">{{requirement.id}}<br>Stage {{requirement.stage}} · {{requirement.stream}}</p>
   <section class="statement-section"><h3>Themes</h3><p class="section-caption">Used to group skills and prioritise weekly plans.</p><div class="theme-chips"><span v-for="theme in themes" :key="theme">{{theme}}</span><span v-if="!themes.length">No themes assigned</span></div><details v-if="otherTags.length" class="other-tags"><summary>Other tags</summary><p>{{otherTags.join(' · ')}}</p></details><p v-if="requirement.workflow" class="section-caption">Workbook workflow: {{requirement.workflow}}</p></section>
   <section class="statement-section"><h3>Locations</h3><div class="theme-chips"><span>{{planningLocations(requirement).preferred||'Flexible / anywhere'}}</span><span v-for="location in planningLocations(requirement).alternatives" :key="location">{{location}}</span></div></section>
   <section class="statement-section required-sessions"><h3>Required sessions</h3><strong>{{target}} {{target===1?'session':'sessions'}}</strong></section>
   <section class="statement-section"><h3>Scout evidence</h3><label class="check compact-toggle"><input v-model="hideComplete" type="checkbox">Hide completed Scouts</label><p v-if="!scope.length" class="section-caption">Choose imported Scouts in Scout scope to view or record evidence.</p><p v-else-if="!scouts.length" class="section-caption">All selected Scouts are complete. Turn off the filter to view their evidence.</p>
    <details v-for="scout in scouts" :key="scout" :class="['scout-evidence-row',{complete:record(scout).completed}]">
     <summary><span class="scout-name">{{scout}}</span><span :class="['evidence-amount',{verified:record(scout).completed}]" :aria-label="occurrenceState(record(scout),requirement)+' of '+target+' evidence opportunities; '+(record(scout).completed?'complete':'not yet verified')">{{record(scout).completed?'✓ ':''}}{{occurrenceState(record(scout),requirement)}} / {{target}}</span><span class="evidence-chevron" aria-hidden="true">⌄</span></summary>
     <div class="scout-evidence-content"><label class="check"><input type="checkbox" :aria-label="scout" :checked="record(scout).completed" @change="complete(scout,($event.target as HTMLInputElement).checked)">Leader-verified completion</label><p v-if="!record(scout).completed&&occurrenceState(record(scout),requirement)>=target" class="section-caption">The planning count is met; leader verification is still needed.</p><dl><div><dt>Completion date</dt><dd>{{record(scout).date||'Not recorded'}}</dd></div><div><dt>Evidence source</dt><dd>{{sourceLabel(scout)}}</dd></div><div v-if="record(scout).sourceSheet"><dt>Workbook</dt><dd>{{record(scout).sourceSheet}}<template v-if="record(scout).sourceRow"> · row {{record(scout).sourceRow}}</template></dd></div><div v-if="record(scout).highlighted"><dt>Workbook evidence</dt><dd>Highlighted completion cell</dd></div><div v-if="record(scout).workflow"><dt>Workflow</dt><dd>{{record(scout).workflow}}</dd></div></dl><div v-if="record(scout).sessionEvidence?.length"><strong class="section-caption">Recorded sessions</strong><ul><li v-for="session in record(scout).sessionEvidence" :key="session">{{session}}</li></ul></div><p v-if="record(scout).completed&&record(scout).source==='workbook'" class="section-caption">Imported completion is recognised even without separate session entries.</p></div>
    </details>
   </section>
   <section class="statement-section"><h3>Requirement links</h3><p class="section-caption">Solid arrows show mandatory readiness prerequisites. Dashed arrows show recommendations.</p><p v-if="!prerequisites.length" class="section-caption">{{requirement.stage===1?'Stage 1 has no readiness prerequisites.':'No mandatory prerequisites.'}}</p><button v-for="id in prerequisites" :key="id" class="statement-link mandatory" @click="ui.requirementId=id"><span aria-hidden="true">→</span><span><small>Mandatory prerequisite</small>{{requirementName(id)}}</span></button><button v-for="link in requirement.suggested_links" :key="link.id" class="statement-link recommended" :title="link.reason" @click="ui.requirementId=link.id"><span aria-hidden="true">⇢</span><span><small>Recommended link</small>{{requirementName(link.id)}}</span></button></section>
   <section class="statement-section"><h3>Linked activities</h3><p v-for="activity in activities" :key="activity.id">{{activity.title||activity.name||activity.id}}</p><p v-if="!activities.length" class="section-caption">No activities linked yet.</p></section>
   <button @click="editing=!editing;text=JSON.stringify(requirement,null,2)">Edit requirement fields</button><form v-if="editing" @submit.prevent="save"><p>All metadata is editable; the ID stays fixed. Mandatory cycles and missing links are rejected.</p><label>Requirement JSON<textarea v-model="text" rows="20" /></label><button>Save requirement</button></form>
  </div>
 </aside>
</template>
