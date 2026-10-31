<script setup lang="ts">
import { computed } from 'vue';
export interface ToolbarState { strategy:string; weeks:number; capacity:number; locations:boolean; externalWeeks:string; }
const props=defineProps<{state:{current:ToolbarState};action:(id:string)=>void;change:(field:keyof ToolbarState,value:string|number|boolean)=>void;importFile:(file:File)=>void}>();
const value=computed(()=>props.state.current);
</script>
<template>
 <div class="studio-toolbar">
  <label>Strategy <select :value="value.strategy" @change="change('strategy',($event.target as HTMLSelectElement).value)"><option value="progress">Scout progress first</option><option value="curriculum">Curriculum first</option><option value="location">Location-focused</option><option value="balanced">Balanced</option></select></label>
  <label>Weeks <input type="number" min="1" max="60" :value="value.weeks" @change="change('weeks',Number(($event.target as HTMLInputElement).value))"></label>
  <label>Default requirements / night <input type="number" min="1" max="12" :value="value.capacity" @change="change('capacity',Number(($event.target as HTMLInputElement).value))"></label>
  <button class="button primary" @click="action('generateSchedule')">Generate schedule</button>
  <button class="button secondary" @click="action('regenerateSchedule')">Regenerate unlocked</button>
 </div>
</template>
