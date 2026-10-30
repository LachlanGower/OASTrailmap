<script setup lang="ts">
import {computed} from 'vue';
export interface RepeatGap {id:string;text:string;planned:number;required:number;unit:string;basis:string}
export interface ForecastSnapshot {hasSchedule:boolean;weeks:number;scouts:number;initial:number;final:number;points:number[];limit:number;unmet:RepeatGap[]}
const props=defineProps<{state:{current:ForecastSnapshot}}>();
const view=computed(()=>props.state.current);
const width=920,height=250,left=58,right=28,top=22,bottom=43;
const maxY=computed(()=>Math.max(10,view.value.limit));
const x=(i:number)=>left+i*(width-left-right)/Math.max(1,view.value.weeks);
const y=(n:number)=>height-bottom-(n/maxY.value)*(height-top-bottom);
const path=computed(()=>[view.value.initial,...view.value.points].map((n,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(n).toFixed(1)).join(' '));
const ticks=computed(()=>[0,.25,.5,.75,1].map(p=>Math.round(maxY.value*p)));
</script>
<template>
 <p v-if="!view.hasSchedule" class="muted">Generate a schedule to see forecasted requirement progress.</p>
 <section v-else class="forecast-panel">
  <h3>Forecasted Scout requirement progress</h3>
  <p class="muted tiny">Conditional projection: assumes selected Scouts attend all planned sessions, demonstrate the requirements, and a leader confirms each achievement. No progress is recorded by this chart. Existing Excel/manual completions are treated as achieved.</p>
  <div class="forecast-summary"><span><strong>{{ view.initial.toFixed(1) }}</strong> average requirements already completed per Scout</span><span><strong>{{ view.final.toFixed(1) }}</strong> forecast after {{ view.weeks }} weeks</span><span><strong>{{ view.scouts }}</strong> Scouts in forecast</span></div>
  <p v-if="!view.scouts">Select Scouts above to see an individual progress forecast; curriculum-only planning shows no Scout forecast.</p>
  <svg v-else :viewBox="'0 0 '+width+' '+height" role="img" aria-label="Line chart: average projected completed requirements per Scout, week zero through the final week.">
   <title>Forecast of Scout requirement completion by week</title>
   <g v-for="tick in ticks" :key="tick"><line :x1="left" :x2="width-right" :y1="y(tick)" :y2="y(tick)" stroke="#dbe6dc"/><text :x="left-10" :y="y(tick)+4" text-anchor="end" font-size="11" fill="#466354">{{ tick }}</text></g>
   <line :x1="left" :x2="width-right" :y1="height-bottom" :y2="height-bottom" stroke="#466354"/>
   <path :d="path" fill="none" stroke="#276b50" stroke-width="3" stroke-linejoin="round"/>
   <circle :cx="x(0)" :cy="y(view.initial)" r="4" fill="#276b50"/><circle :cx="x(view.weeks)" :cy="y(view.final)" r="4" fill="#276b50"/>
   <text :x="left" :y="height-12" font-size="12">Week 0</text><text :x="width-right" :y="height-12" text-anchor="end" font-size="12">Week {{ view.weeks }}</text><text x="8" y="13" font-size="11">Requirements completed (average)</text>
  </svg>
  <details><summary>Repeat requirements needing more scheduled nights ({{ view.unmet.length }})</summary>
   <p v-if="!view.unmet.length">All repeated requirements have enough planned sessions.</p>
   <ul v-else><li v-for="gap in view.unmet" :key="gap.id">{{ gap.text }} — {{ gap.planned }} / {{ gap.required }} {{ gap.unit }} ({{ gap.basis }})</li></ul>
  </details>
 </section>
</template>
