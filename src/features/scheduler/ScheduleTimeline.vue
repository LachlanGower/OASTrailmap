<script setup lang="ts">
import { computed } from 'vue';
export interface TimelineWeek { week:number; title:string; location:string; skills:number; locked:boolean; external:boolean; preferred:boolean; }
const props=defineProps<{state:{current:TimelineWeek[]};selectWeek:(index:number)=>void}>();
const weeks=computed(()=>props.state.current);
</script>
<template>
  <button v-for="item in weeks" :key="item.week" type="button"
    :data-timeline="item.week-1"
    :class="{locked:item.locked,external:item.external,preferred:item.preferred}"
    :title="item.title+' · '+item.location"
    :aria-label="'Week '+item.week+': '+item.title+', '+item.skills+' skills'+(item.locked?', locked':'')"
    @click="selectWeek(item.week-1)">
    <b>W{{ item.week }}</b><br>{{ item.skills }} skills
  </button>
</template>
