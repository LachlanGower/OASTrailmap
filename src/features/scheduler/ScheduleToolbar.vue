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
  <label class="toggle"><input type="checkbox" :checked="value.locations" @change="change('locations',($event.target as HTMLInputElement).checked)"> Consider locations in recommendations</label>
  <button class="button primary" @click="action('generateSchedule')">Generate schedule</button>
  <button class="button secondary" @click="action('regenerateSchedule')">Regenerate unlocked</button>
  <button class="button secondary" @click="action('exportSchedule')">Export schedule.json</button>
  <label class="button secondary file-button" for="vue-import-schedule">Import schedule</label>
  <input id="vue-import-schedule" type="file" accept=".yaml,.yml,.json" hidden @change="($event.target as HTMLInputElement).files?.[0] && importFile(($event.target as HTMLInputElement).files![0]); ($event.target as HTMLInputElement).value=''">
 </div>
 <div class="studio-toolbar">
  <label>Preferred external weeks (comma-separated) <input :value="value.externalWeeks" placeholder="3, 8, 14" @input="change('externalWeeks',($event.target as HTMLInputElement).value)"></label>
  <button class="button secondary" @click="action('applyExternalWeeks')">Set preferred weeks</button>
 </div>
</template>
