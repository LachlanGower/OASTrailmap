<script setup lang="ts">
import { computed, onMounted, onUpdated } from 'vue';
import { hasPlannerPriority, mapNodeTitle, mapStages } from './map-model';
import type { RequirementMapSnapshot } from './map-model';

const props = defineProps<{
  state: { current: RequirementMapSnapshot };
  onSelect: (id: string) => void;
  onPaint: () => void;
}>();
const stages = computed(() => mapStages(props.state.current));
const snapshot = computed(() => props.state.current);

// The original drawRelatedEdges() owns the advisory overlay. It runs *after*
// Vue paints the nodes, so measured positions and CSS.escape lookups still work.
onMounted(() => props.onPaint());
onUpdated(() => props.onPaint());
</script>

<template>
  <div v-if="snapshot.nodes.length" class="map-grid">
    <section v-for="group in stages" :key="group.stage" class="stage-column">
      <div class="stage-title">
        <h3>Stage {{ group.stage }}</h3>
        <span>{{ group.count }} skills shown</span>
      </div>
      <div v-for="streamGroup in group.streams" :key="streamGroup.stream" class="stream-block">
        <h4 class="stream-title">{{ streamGroup.stream }}</h4>
        <button
          v-for="node in streamGroup.nodes"
          :key="node.id"
          :data-id="node.id"
          :class="[
            'requirement-node',
            'state-' + node.status,
            { 'has-activity': node.hasActivity, selected: node.selected }
          ]"
          :title="node.text"
          type="button"
          @click="onSelect(node.id)"
        >
          <span class="node-mark">{{ node.status === 'complete' ? '✓' : node.status === 'blocked' ? '!' : '→' }}</span>
          <span class="node-copy">{{ node.text }}<span class="node-meta">{{ node.workflow ? node.workflow + ' · ' : '' }}{{ mapNodeTitle(node, snapshot.groupScope) }}{{ snapshot.groupScope && node.status === 'ready' ? ' · ' + node.readyCount + ' ready' : '' }}</span></span>
          <span
            v-if="hasPlannerPriority(node, snapshot)"
            class="node-badge priority-badge"
            :title="node.readyCount + ' Scouts can work on this now'"
          >{{ node.readyCount }} READY</span>
          <span v-if="node.hasActivity" class="node-badge activity-badge">ACTIVITY</span>
        </button>
      </div>
    </section>
  </div>
</template>
