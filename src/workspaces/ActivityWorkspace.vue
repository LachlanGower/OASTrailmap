<script setup lang="ts">
import { computed,ref } from 'vue';
import { state, change, ui, tags } from '../state';
import { prepareActivityChange, suggestActivityCoverage } from '../domain/activity-planning';
import type { Activity } from '../domain/models';
const query=ref(''),tag=ref(''),editor=ref(''),editing=ref(false);
const activities=computed(()=>(state.value?.progress.activities??[]).filter(a=>(!tag.value||a.tags?.includes(tag.value))&&JSON.stringify(a).toLowerCase().includes(query.value.toLowerCase())));
function edit(a?:Activity){editor.value=JSON.stringify(a??{id:'activity-'+Date.now(),title:'New activity',description:'',tags:[],covers:[]},null,2);editing.value=true;}
function save(){try{const activity=JSON.parse(editor.value) as Activity;if(change('Before activity edit',s=>{s.progress.activities=prepareActivityChange(s.progress.activities??[],activity,s.requirements);})){editing.value=false;}}catch(e){ui.error=String(e);}}
function suggest(){try{const a=JSON.parse(editor.value) as Activity;a.covers=suggestActivityCoverage(state.value!.requirements,a.tags??[],String(a.location??''),a.covers);editor.value=JSON.stringify(a,null,2);}catch(e){ui.error=String(e);}}
</script>
<template><section><div class="toolbar"><label>Search activities<input v-model="query" type="search"></label><label>Tag<select v-model="tag"><option value="">All tags</option><option v-for="t in tags" :key="t">{{t}}</option></select></label><button @click="edit()">Create activity</button></div><form v-if="editing" class="panel" @submit.prevent="save"><label>Activity fields (JSON)<textarea v-model="editor" rows="18" /></label><button type="button" @click="suggest">Suggest coverage from tags and location</button><button>Save activity</button><button type="button" @click="editing=false">Cancel</button></form><article v-for="a in activities" :key="a.id" class="panel"><h2>{{a.title||a.name||a.id}}</h2><p>{{a.description}}</p><p>{{a.tags?.join(', ')}}</p><div><button v-for="id in a.covers" :key="id" @click="ui.requirementId=id">{{id}}</button></div><button @click="edit(a)">Edit</button><button @click="change('Before deleting activity',s=>{s.progress.activities=s.progress.activities?.filter(x=>x.id!==a.id)})">Delete activity</button></article><p v-if="!activities.length">No activities match. Create one or import an activity bank through Data & State.</p></section></template>
