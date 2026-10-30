<script setup lang="ts">
import {computed} from 'vue';
export interface CoverageItem {id:string;text:string;stage:number;stream:string;linked:number;activityNames:string[];planned:number;needed:number;weeks:number[];scoutsDone:number;scoutsTotal:number;evidence:number;status:string}
export interface CoverageSnapshot {rows:CoverageItem[];counts:Record<string,number>}
const props=defineProps<{state:{current:CoverageSnapshot}}>();
const data=computed(()=>props.state.current);
const statusNames:Record<string,string>={unaddressed:'Unaddressed',partial:'Partially addressed',planned:'Fully planned',complete:'Completed for selected Scouts'};
</script>
<template>
 <div class="data-stats">
  <div v-for="status in ['unaddressed','partial','planned','complete']" :key="status" class="data-stat"><strong>{{ data.counts[status]||0 }}</strong><span>{{ statusNames[status] }}</span></div>
 </div>
 <div class="tracker-table-wrap"><table class="tracker-table">
  <thead><tr><th>Requirement</th><th>Stage / stream</th><th>Activity Studio</th><th>Sessions planned</th><th>Scout evidence</th><th>Status</th></tr></thead>
  <tbody id="vueCoverageRows">
   <tr v-for="row in data.rows" :key="row.id">
    <td><strong>{{ row.text }}</strong><small>{{ row.id }}</small></td>
    <td>Stage {{ row.stage }} · {{ row.stream }}</td>
    <td>{{ row.linked }} linked<small v-if="row.linked">{{ row.activityNames.slice(0,2).join('; ') }}</small></td>
    <td>{{ row.planned }}/{{ row.needed }}<small>{{ row.weeks.join(', ')||'Not scheduled' }}</small></td>
    <td>{{ row.scoutsDone }}/{{ row.scoutsTotal }} Scouts complete<small v-if="row.scoutsTotal">{{ row.evidence }} total evidence credits</small></td>
    <td><span :class="['tracker-status',row.status]">{{ row.status }}</span></td>
   </tr>
   <tr v-if="!data.rows.length"><td colspan="6">No requirements match these filters.</td></tr>
  </tbody>
 </table></div>
</template>
