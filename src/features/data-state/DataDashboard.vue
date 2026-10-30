<script setup lang="ts">
import {computed} from 'vue';
export interface DataCount {type:string;label:string;count:number}
const props=defineProps<{state:{current:DataCount[]};exportData:(type:string)=>void}>();
const records=computed(()=>props.state.current);
</script>
<template>
 <div class="data-stats" aria-label="Stored dataset totals">
  <div v-for="item in records" :key="item.type" class="data-stat"><strong>{{item.count}}</strong><span>{{item.label}}</span></div>
 </div>
 <h3>Export</h3>
 <div class="studio-toolbar" aria-label="Export datasets">
  <button v-for="item in [{type:'full',label:'Complete backup'},...records.map(r=>({type:r.type,label:r.label}))]" :key="item.type" type="button" class="button secondary" :data-vue-export="item.type" @click="exportData(item.type)">Export {{item.label}}</button>
 </div>
</template>
