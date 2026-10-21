<script setup lang="ts">
import { computed } from 'vue';
import type { ScoutPickerSnapshot } from './types';
const props=defineProps<{state:{current:ScoutPickerSnapshot}}>();
const snapshot=computed(()=>props.state.current);
</script>
<template>
  <label v-for="name in snapshot.names" :key="name" class="scout-option">
    <input type="checkbox" :value="name" :checked="snapshot.subset.includes(name)">
    <span>{{ name }}</span>
  </label>
  <p v-if="!snapshot.names.length" class="empty-inline">Import a workbook or add Scout progress first.</p>
</template>
