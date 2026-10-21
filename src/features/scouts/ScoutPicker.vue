<script setup lang="ts">
import { computed } from 'vue';
import type { ScoutPickerSnapshot } from './types';
const props=defineProps<{
  state: {current:ScoutPickerSnapshot};
  onSelect: (selection:string)=>void;
}>();
const current=computed(()=>props.state.current);
</script>
<template>
  Scout view
  <select id="scoutSelect" :value="current.selected" @change="onSelect(($event.target as HTMLSelectElement).value)">
    <option value="__all__">All Scouts · pack overview</option>
    <option value="__subset__">Selected Scouts · subset</option>
    <option v-for="name in current.names" :key="name" :value="name">{{ name }}</option>
  </select>
</template>
