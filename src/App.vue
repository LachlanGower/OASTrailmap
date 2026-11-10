<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { initialize, state, ui, names, scope, change } from './state';
import RequirementWorkspace from './workspaces/RequirementWorkspace.vue';
import RequirementDetail from './workspaces/RequirementDetail.vue';
import SchedulerWorkspace from './workspaces/SchedulerWorkspace.vue';
import DataWorkspace from './workspaces/DataWorkspace.vue';
import ActivityWorkspace from './workspaces/ActivityWorkspace.vue';
import ApplicationRequirements from './features/application-requirements/ApplicationRequirements.vue';
import { parseCatalogue, type ApplicationCatalogue } from './features/application-requirements/catalogue';
import { LEGACY_KEYS } from './services/legacy-state';
const routes=['Trailmap','Skill Trees','Scheduler','Activities','Weekly Themes','Requirements Tracker','Data & State','Application Requirements','Help'];
const route=ref('Trailmap'),catalogue=ref<ApplicationCatalogue|null>(null),scout=ref('');
function syncRoute(){const value=decodeURIComponent(location.hash.slice(1));route.value=routes.includes(value)?value:'Trailmap';}
function storageChanged(event:StorageEvent){if(event.key===null||event.key===LEGACY_KEYS.progress||event.key===LEGACY_KEYS.studio){ui.stale=true;ui.error='Another tab changed local data. Reload before editing.';}}
const selected=computed(()=>state.value?.requirements.find(r=>r.id===ui.requirementId));
function addScout(){const name=scout.value.trim();if(!name||name.includes('::')||name.startsWith('__')){ui.error='Enter a Scout name without :: or a reserved prefix.';return;}if(change('Before adding Scout',s=>{s.progress.scoutRecords[name+'::__roster__']??={completed:false,date:'',source:'manual-roster'};})){ui.selection=name;scout.value='';}}
onMounted(async()=>{syncRoute();window.addEventListener('hashchange',syncRoute);window.addEventListener('storage',storageChanged);await initialize();try{const r=await fetch(new URL('data/application-requirements.json',document.baseURI));catalogue.value=parseCatalogue(await r.json());}catch(e){ui.error=String(e);}});
onUnmounted(()=>{window.removeEventListener('hashchange',syncRoute);window.removeEventListener('storage',storageChanged);});
</script>
<template>
 <header><a class="brand" href="#Trailmap">✦ OAS Trailmap</a><span>Local-first Scout planning</span><a href="./legacy.html" target="_blank" rel="noopener">Compare legacy app ↗</a></header>
 <main>
  <p class="notice">Standalone Vue · draft migration. Some advanced tools still require parity work. <a href="#Help">See known gaps</a>.</p>
  <div v-if="ui.error" class="error" role="alert">{{ui.error}} <button @click="ui.error=''">Dismiss</button></div>
  <p role="status" aria-live="polite">{{ui.notice}}</p>
  <template v-if="state">
   <nav aria-label="Workspaces"><a v-for="name in routes" :key="name" :href="'#'+encodeURIComponent(name)" :aria-current="route===name?'page':undefined">{{name}}</a></nav>
   <section class="scope toolbar"><label>Scout scope<select v-model="ui.selection"><option value="__all__">All Scouts</option><option value="__subset__">Selected subset</option><option v-for="name in names" :key="name">{{name}}</option></select></label><span>{{scope.length}} Scouts · {{state.requirements.length}} requirements</span><form class="toolbar" @submit.prevent="addScout"><label>Add Scout<input v-model="scout" placeholder="Scout name"></label><button>Add Scout</button></form></section>
   <fieldset v-if="ui.selection==='__subset__'"><legend>Scouts in subset</legend><label v-for="name in names" :key="name" class="check"><input v-model="ui.subset" type="checkbox" :value="name">{{name}}</label></fieldset>
   <h1>{{route}}</h1>
   <div class="workspace"><div class="workspace-main">
    <RequirementWorkspace v-if="['Trailmap','Skill Trees','Weekly Themes','Requirements Tracker'].includes(route)" :mode="route" />
    <SchedulerWorkspace v-else-if="route==='Scheduler'" />
    <DataWorkspace v-else-if="route==='Data & State'" />
    <ActivityWorkspace v-else-if="route==='Activities'" />
    <ApplicationRequirements v-else-if="route==='Application Requirements'&&catalogue" :catalogue="catalogue" />
    <section v-else><h2>Working locally</h2><p>Changes save in this browser. Use Data & State to download a full backup before comparing apps. Both apps share existing browser data on the same origin. Close one before editing in the other.</p><h2>Draft parity gaps</h2><p>The Vue interface owns every workspace, navigation and save action. Advanced tree canvas positioning and private link-layer editing, Trello exchange, the detailed per-Scout forecast, activity-file attachments and session review workflow are still pending. Existing fields are retained in storage and backups. Use the separate legacy app to compare those tools.</p><p>The application requirements catalogue describes the PR #40 product; its implementation statuses do not certify parity in this draft.</p><p>Scheduling plans opportunities and never awards evidence. Stage 1 is ready without mandatory prerequisites. Curriculum IDs and individual Scout evidence remain distinct even when duplicate text is grouped for display.</p><a href="./docs/standalone-vue.md">Migration and local verification notes</a></section>
   </div><RequirementDetail v-if="selected" :key="selected.id" :requirement="selected" /></div>
  </template><p v-else>Loading application… If loading fails, stored data is left untouched.</p>
 </main><footer>Private Scout records stay in this browser. Export backups regularly.</footer>
</template>
