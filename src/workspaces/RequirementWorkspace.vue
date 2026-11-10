<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, ui, scope, tags, change } from '../state';
import { isCompleted, requirementStatus, readyScoutCount } from '../domain/progress';
import type { OasRequirement } from '../domain/models';
const props=defineProps<{mode:string}>();
const query=ref(''),stage=ref(''),stream=ref(''),status=ref(''),tag=ref(''),tree=ref(''),group=ref(false),newTree=ref('');
const trees=computed(()=>[...new Set([...(state.value?.studio.trees??[]),...(state.value?.requirements.map(r=>String(r.tree??r.stream))??[])])]);
const getStatus=(r:OasRequirement)=>requirementStatus(r,ui.selection,scope.value,state.value!.requirements,state.value!.progress.scoutRecords);
const filtered=computed(()=>{const seen=new Set<string>();return (state.value?.requirements??[]).filter(r=>{
 if(stage.value&&r.stage!==Number(stage.value)||stream.value&&r.stream!==stream.value||tag.value&&!r.tags.includes(tag.value)||tree.value&&props.mode==='Skill Trees'&&String(r.tree??r.stream)!==tree.value)return false;
 if(query.value&&!`${r.id} ${r.text} ${r.tags.join(' ')}`.toLowerCase().includes(query.value.toLowerCase()))return false;
 const s=getStatus(r);if(status.value==='outstanding'?s==='complete':status.value&&s!==status.value)return false;
 if(group.value){const key=String(r.duplicate_of??r.text.toLowerCase().replace(/[^a-z0-9]+/g,' '));if(seen.has(key))return false;seen.add(key);}return true;
});});
function manageTree(action:string){const name=newTree.value.trim();if(action!=='delete'&&!name)return;
 if(action==='delete'&&trees.value.length<2){ui.error='Keep at least one tree.';return;}
 const previous=tree.value;if(action!=='add'&&!previous){ui.error='Choose a tree first.';return;}
 const fallback=trees.value.find(t=>t!==previous)!;
 if(change('Before '+action+' tree',s=>{s.studio.trees=[...trees.value];if(action==='add'){if(!s.studio.trees.includes(name))s.studio.trees.push(name);}else{if(action==='rename'&&trees.value.includes(name))throw new Error('Tree name already exists');s.requirements.forEach(r=>{if(String(r.tree??r.stream)===previous)r.tree=action==='rename'?name:fallback;});s.studio.trees=s.studio.trees.map(t=>t===previous?action==='rename'?name:fallback:t).filter((t,i,a)=>a.indexOf(t)===i);if(s.studio.order?.[previous]){if(action==='rename')s.studio.order![name]=s.studio.order![previous];delete s.studio.order![previous];}if(s.studio.treeGraphs?.[previous]){if(action==='rename')s.studio.treeGraphs![name]=s.studio.treeGraphs![previous];delete s.studio.treeGraphs![previous];}}})){tree.value=action==='delete'?fallback:name;newTree.value='';}}
</script>
<template>
 <section><div class="toolbar"><label>Search<input v-model="query" type="search" placeholder="Text, ID or tag"></label><label>Stage<select v-model="stage"><option value="">All stages</option><option v-for="s in [1,2,3]" :key="s">{{s}}</option></select></label><label>Stream<select v-model="stream"><option value="">All streams</option><option>Camping</option><option>Bushwalking</option><option>Bushcraft</option></select></label><label>Status<select v-model="status"><option value="">All</option><option value="ready">Ready</option><option value="blocked">Blocked</option><option value="complete">Complete</option><option value="outstanding">Outstanding</option></select></label><label>Theme / tag<select v-model="tag"><option value="">All themes</option><option v-for="t in tags" :key="t">{{t}}</option></select></label><label class="check"><input v-model="group" type="checkbox">Group duplicate text for display</label></div>
 <div v-if="mode==='Skill Trees'" class="toolbar"><label>Tree<select v-model="tree"><option value="">All trees</option><option v-for="t in trees" :key="t">{{t}}</option></select></label><label>Tree name<input v-model="newTree"></label><button @click="manageTree('add')">Add tree</button><button @click="manageTree('rename')">Rename selected</button><button @click="manageTree('delete')">Delete and reassign</button><p>IDs and Scout evidence are preserved. Use a checkpoint to undo changes.</p></div>
 <p>{{filtered.length}} requirements shown. {{group?'Hidden duplicates remain independent records.':''}}</p>
 <div class="requirement-grid"><section v-for="n in [1,2,3]" :key="n"><h2>Stage {{n}}</h2><button v-for="r in filtered.filter(r=>r.stage===n)" :key="r.id" :class="['requirement',getStatus(r),{selected:ui.requirementId===r.id}]" @click="ui.requirementId=r.id"><small>{{r.stream}} · {{r.id}}</small><strong>{{r.text}}</strong><span>{{getStatus(r)}} · {{readyScoutCount(r,scope,state!.requirements,state!.progress.scoutRecords)}} ready</span><span v-if="mode==='Requirements Tracker'">{{scope.filter(s=>isCompleted(state!.progress.scoutRecords,s,r.id)).length}} / {{scope.length}} Scouts complete</span><span v-if="mode==='Skill Trees'">Prerequisites: {{r.prerequisites.join(', ')||'None'}}<br>Recommended: {{r.suggested_links?.map(x=>x.id).join(', ')||'None'}}</span></button></section></div>
 <p v-if="!filtered.length">No matching requirements. Clear filters to see more.</p></section>
</template>
