<script setup lang="ts">
import { computed } from 'vue';
export interface WeekSkill {id:string;text:string;stage:number;}
export interface WeekCard {week:number;locked:boolean;theme:string;capacity:number;skills:WeekSkill[];potential:number;activityName:string;}
const props=defineProps<{state:{current:WeekCard[]};tags:{current:string[]}}>();
const weeks=computed(()=>props.state.current);
const themes=computed(()=>props.tags.current);
</script>
<template>
 <article v-for="w in weeks" :key="w.week" :class="['week-card',{'week-locked':w.locked}]">
  <div class="week-head"><strong>Week {{ w.week }}</strong><label><input type="checkbox" :data-week-lock="w.week-1" :checked="w.locked"> Lock</label></div>
  <label>Theme <select :data-week-tag="w.week-1" :value="w.theme"><option value="">Select theme</option><option v-for="t in themes" :key="t" :value="t">{{ t }}</option></select></label>
  <label>Capacity <input type="number" min="1" max="12" :data-week-capacity="w.week-1" :value="w.capacity"></label>
  <small>{{ w.skills.length }} planned requirements · {{ w.potential }} Scouts affected</small>
  <ol><li v-for="r in w.skills" :key="r.id" :title="r.id">{{ r.text }} <small>Stage {{ r.stage }}</small></li></ol>
  <p v-if="!w.skills.length" class="tiny muted">No requirements allocated.</p>
  <div class="week-actions">
   <button class="button secondary" :data-week-move="w.week-1" :disabled="w.week===1">↑ Move earlier</button>
   <button class="button secondary" :data-week-edit="w.week-1">Edit skills</button>
   <label class="button secondary file-button" :for="'week-activity-'+(w.week-1)">{{ w.activityName?'Replace activity':'Attach activity' }}</label>
   <input :id="'week-activity-'+(w.week-1)" :data-week-file="w.week-1" type="file" accept=".yaml,.yml,.json,.txt,.md" hidden>
   <button class="button secondary" :data-week-review="w.week-1">Review skills</button>
  </div>
  <p v-if="w.activityName" class="tiny"><b>Attached:</b> {{ w.activityName }}</p>
  <div :id="'week-review-'+(w.week-1)" hidden></div>
 </article>
</template>
