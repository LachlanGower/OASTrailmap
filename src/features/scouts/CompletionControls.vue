<script setup lang="ts">
import type { ScoutCompletionSnapshot } from './types';
const props=defineProps<{
  snapshot:ScoutCompletionSnapshot;
  onComplete:(scout:string,requirementId:string,checked:boolean)=>void;
  onDate:(scout:string,requirementId:string,date:string)=>void;
}>();
function complete(scout:string,event:Event):void{
  props.onComplete(scout,props.snapshot.requirementId,(event.target as HTMLInputElement).checked);
}
function editDate(scout:string,event:Event):void{
  props.onDate(scout,props.snapshot.requirementId,(event.target as HTMLInputElement).value);
}
</script>
<template>
  <template v-if="snapshot.group">
    <template v-if="snapshot.entries.length">
      <div v-for="entry in snapshot.entries" :key="entry.scout" class="completion-control">
        <input type="checkbox" :data-complete-scout="entry.scout" :checked="entry.completed" @change="complete(entry.scout,$event)">
        <label>{{ entry.scout }}</label>
      </div>
    </template>
    <p v-else class="empty-inline">{{ snapshot.hideCompleted ? "No outstanding Scouts in this selection." : "Import a workbook to add Scouts, or select an individual Scout after importing." }}</p>
  </template>
  <template v-else-if="snapshot.entries.length">
    <div class="completion-control">
      <input id="detailComplete" type="checkbox" :checked="snapshot.entries[0].completed" @change="complete(snapshot.entries[0].scout,$event)">
      <label for="detailComplete">Mark requirement complete</label>
    </div>
    <label class="detail-label" for="completionDate">Completion date (optional)</label>
    <input id="completionDate" class="date-input" type="date" :value="snapshot.entries[0].date" @change="editDate(snapshot.entries[0].scout,$event)">
    <p class="tiny">Manually marked changes are saved in this browser.</p>
  </template>
</template>
