<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { initialize, state, ui, names, scope } from './state';
import RequirementWorkspace from './workspaces/RequirementWorkspace.vue';
import RequirementDetail from './workspaces/RequirementDetail.vue';
import SchedulerWorkspace from './workspaces/SchedulerWorkspace.vue';
import DataWorkspace from './workspaces/DataWorkspace.vue';
import ActivityWorkspace from './workspaces/ActivityWorkspace.vue';
import ApplicationRequirements from './features/application-requirements/ApplicationRequirements.vue';
import { parseCatalogue, type ApplicationCatalogue } from './features/application-requirements/catalogue';
import { LEGACY_KEYS } from './services/legacy-state';
import RequirementsTracker from './workspaces/RequirementsTracker.vue';
import { coverageRows } from './domain/coverage-tracker';
import SkillTreeWorkspace from './workspaces/SkillTreeWorkspace.vue';
import CurriculumEditor from './workspaces/CurriculumEditor.vue';
import HelpWorkspace from './workspaces/HelpWorkspace.vue';
import StageDetail from './workspaces/StageDetail.vue';
const sections=[
 {name:'Planner',tabs:['Trailmap','Scheduler','Activity Studio']},
 {name:'Curriculum Mapping',tabs:['Curriculum Editor','Skill Trees','Requirements Tracker']},
 {name:'Data and State',tabs:['Monitoring','Importer','Exporter','Recovery and reset']},
 {name:'Help',tabs:['Help docs','Application Requirements','Future state']}
];
const routes=sections.flatMap(section=>section.tabs);
const route=ref('Trailmap'),catalogue=ref<ApplicationCatalogue|null>(null);
const section=computed(()=>sections.find(s=>s.tabs.includes(route.value))!);
function syncRoute(){let value='';try{value=decodeURIComponent(location.hash.slice(1));}catch{/* Invalid hashes fall back to Trailmap. */}const aliases:Record<string,string>={'Activities':'Activity Studio','Data & State':'Monitoring','Help':'Help docs','Weekly Themes':'Curriculum Editor'};value=aliases[value]??value;route.value=routes.includes(value)?value:'Trailmap';}
watch(route,()=>{ui.requirementId='';ui.stageSelection=null;});
watch(()=>ui.requirementId,id=>{if(id)ui.stageSelection=null;});
const selectedStageIndex=computed(()=>{const selection=ui.stageSelection;if(!selection)return -1;const weeks=state.value?.studio.schedule??[];return selection.weekId?weeks.findIndex(w=>w.id===selection.weekId):selection.weekIndex<weeks.length?selection.weekIndex:-1;});
function storageChanged(event:StorageEvent){if(event.key===null||event.key===LEGACY_KEYS.progress||event.key===LEGACY_KEYS.studio){ui.stale=true;ui.error='Another tab changed local data. Reload before editing.';}}
const coverage=computed(()=>state.value?coverageRows(state.value.requirements,state.value.progress.activities??[],state.value.studio.schedule??[],{},[]):[]);
const overview=computed(()=>[{label:'Requirements',value:coverage.value.length,kind:'total'},{label:'Unaddressed',value:coverage.value.filter(r=>r.status==='unaddressed').length,kind:'unaddressed'},{label:'Partially addressed',value:coverage.value.filter(r=>r.status==='partial').length,kind:'partial'},{label:'Fully planned',value:coverage.value.filter(r=>r.status==='planned').length,kind:'planned'},{label:'Addressed',value:coverage.value.filter(r=>r.status!=='unaddressed').length,kind:'addressed'}]);
const selected=computed(()=>state.value?.requirements.find(r=>r.id===ui.requirementId));
onMounted(async()=>{syncRoute();window.addEventListener('hashchange',syncRoute);window.addEventListener('storage',storageChanged);await initialize();try{const r=await fetch(new URL('data/application-requirements.json',document.baseURI));catalogue.value=parseCatalogue(await r.json());}catch(e){ui.error=String(e);}});
onUnmounted(()=>{window.removeEventListener('hashchange',syncRoute);window.removeEventListener('storage',storageChanged);});
</script>
<template>
 <header><a class="brand" href="#Trailmap">✦ OAS Trailmap</a><nav class="major-nav" aria-label="Main sections"><a v-for="s in sections" :key="s.name" :href="'#'+encodeURIComponent(s.tabs[0])" :aria-current="section.name===s.name?'page':undefined">{{s.name}}</a></nav></header>
 <main>
  <div v-if="ui.error" class="error" role="alert">{{ui.error}} <button @click="ui.error=''">Dismiss</button></div>
  <p role="status" aria-live="polite">{{ui.notice}}</p>
  <template v-if="state">
   <nav class="workspace-tabs" aria-label="Workspaces"><a v-for="name in section.tabs" :key="name" :href="'#'+encodeURIComponent(name)" :aria-current="route===name?'page':undefined">{{name}}</a></nav>
   <section v-if="section.name==='Planner'||section.name==='Curriculum Mapping'||route==='Monitoring'" class="scope toolbar"><label>Scout scope<select v-model="ui.selection" aria-label="Scout scope"><option value="__all__">All imported Scouts</option><option value="__subset__">Choose a subset</option><option v-for="name in names" :key="name" :value="name">{{name}}</option></select></label><span>{{scope.length}} Scouts selected · {{state.requirements.length}} requirements</span><p v-if="!names.length">No Scouts imported yet. <a href="#Importer">Import your progress workbook</a> to choose from its roster.</p><fieldset v-if="ui.selection==='__subset__'" class="scout-subset"><legend>Select imported Scouts</legend><label v-for="name in names" :key="name" class="check"><input v-model="ui.subset" type="checkbox" :value="name">{{name}}</label><p v-if="!names.length">Import a workbook to populate this list.</p></fieldset><div class="coverage-summary scope-overview"><article v-for="item in overview" :key="item.kind" :class="['coverage-stat',item.kind]"><strong>{{item.value}}</strong><span>{{item.label}}</span></article></div></section>
   <section class="workspace-surface"><div class="workspace-heading"><p class="eyebrow">{{section.name}}</p><h1>{{route}}</h1></div>
   <div class="workspace"><div class="workspace-main">
    <RequirementWorkspace v-if="route==='Trailmap'" :key="route" :mode="route" />
    <SchedulerWorkspace v-else-if="route==='Scheduler'" />
    <CurriculumEditor v-else-if="route==='Curriculum Editor'" /><SkillTreeWorkspace v-else-if="route==='Skill Trees'" /><RequirementsTracker v-else-if="route==='Requirements Tracker'" />
    <DataWorkspace v-else-if="section.name==='Data and State'" :mode="route" />
    <ActivityWorkspace v-else-if="route==='Activity Studio'" />
    <ApplicationRequirements v-else-if="route==='Application Requirements'&&catalogue" :catalogue="catalogue" />
    <HelpWorkspace v-else :mode="route" />
   </div><RequirementDetail v-if="selected" :key="selected.id" :requirement="selected" /><StageDetail v-else-if="route==='Scheduler'&&ui.stageSelection&&selectedStageIndex>=0" :key="selectedStageIndex+'-'+ui.stageSelection.stage" :week-index="selectedStageIndex" :stage="ui.stageSelection.stage" /></div></section>
  </template><p v-else>Loading application… If loading fails, stored data is left untouched.</p>
 </main><footer>Private Scout records stay in this browser. Export backups regularly.</footer>
</template>
