<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { OasRequirementsPreviewFile, OasRequirementPreview } from '../types/oas';

const requirements = ref<OasRequirementPreview[]>([]);
const error = ref('');
const loading = ref(true);
const streams = ['Camping', 'Bushwalking', 'Bushcraft'] as const;

const counts = computed(() => streams.map(stream => ({
  stream,
  count: requirements.value.filter(r => r.stream === stream).length
})));

onMounted(async () => {
  try {
    // Data is public curriculum reference data, never the user's local Scout data.
    // Relative to the HTML page so subdirectory GitHub Pages builds also work.
    const response = await fetch(new URL('data/requirements.json', document.baseURI));
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json() as OasRequirementsPreviewFile;
    if (!Array.isArray(data.requirements)) throw new Error('Invalid requirement data');
    requirements.value = data.requirements;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unable to load requirements';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="preview">
    <p class="eyebrow">OAS TRAILMAP · MIGRATION TOOLCHAIN</p>
    <h1>Vue foundation preview</h1>
    <p>
      This isolated test page proves Vue, Vite and TypeScript can load the existing
      OAS curriculum. It does not replace any of the current Trailmap workspaces
      and does not read or write Scout progress.
    </p>
    <p><a href="./index.html">Open the unchanged OAS Trailmap</a></p>
    <div class="results" role="status" aria-live="polite">
      <p v-if="loading">Loading existing requirements…</p>
      <p v-else-if="error" class="error">Data load failed: {{ error }}</p>
      <template v-else>
        <p class="summary"><strong data-test="requirement-count">{{ requirements.length }}</strong> OAS requirements loaded</p>
        <ul>
          <li v-for="item in counts" :key="item.stream">{{ item.stream }}: {{ item.count }}</li>
        </ul>
      </template>
    </div>
    <p class="fineprint">Phase 2 is build-system scaffolding only. The production app continues to use the existing HTML and JavaScript.</p>
  </main>
</template>
