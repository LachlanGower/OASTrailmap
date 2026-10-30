<script setup lang="ts">
const props=defineProps<{activate:(id:string)=>void}>();
const actions=[
 {id:'clearAchievementsBtn',label:'Clear achievements only'},
 {id:'clearScoutDataBtn',label:'Clear roster + achievements'},
 {id:'clearPlanBtn',label:'Clear schedule'},
 {id:'restoreDefaultReqsBtn',label:'Restore default requirements'},
 {id:'fullResetBtn',label:'Factory reset'}
] as const;
</script>
<template>
 <section class="recovery-section" aria-labelledby="recovery-heading">
  <h3 id="recovery-heading">Reset &amp; Recovery</h3>
  <p class="muted">Reset only what you choose. Before destructive actions, download a full backup.</p>
  <div class="studio-toolbar">
   <button v-for="action in actions" :key="action.id" type="button" class="button secondary" :data-recovery-action="action.id" :aria-describedby="'recovery-warning'" @click="activate(action.id)">{{action.label}}</button>
  </div>
  <p id="recovery-warning" class="tiny muted">Every destructive action uses the original review, typed confirmation and checkpoint safeguards. A failed checkpoint prevents the change.</p>
 </section>
</template>
