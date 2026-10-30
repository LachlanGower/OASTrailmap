<script setup lang="ts">
import {computed} from 'vue';
import type {TreeCheckpoint} from './admin-types';
const props=defineProps<{
 state:{current:TreeCheckpoint[]};
 restore:(index:number)=>void;
}>();
const entries=computed(()=>props.state.current);
</script>
<template>
  <h3>Local snapshots</h3>
  <p class="tiny muted">Keep exported backups too: browser data may be cleared.</p>
  <div v-for="entry in entries" :key="entry.index" class="history-line">
    <span>{{ entry.title }} <small>{{ entry.at }}</small></span>
    <button class="button secondary" type="button" :data-rollback="entry.index"
      @click="restore(entry.index)">Restore</button>
  </div>
</template>
