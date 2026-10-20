<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  catalogueCsv, catalogueJson, downloadCatalogue, filterCatalogue,
  statusCounts, statusLabel, statuses
} from './catalogue';
import type { ApplicationCatalogue } from './catalogue';

const props = defineProps<{
  catalogue: ApplicationCatalogue;
  initialQuery?: string;
  initialStatus?: string;
  initialCategory?: string;
}>();
const query = ref(props.initialQuery ?? '');
const status = ref(props.initialStatus ?? 'all');
const category = ref(props.initialCategory ?? 'all');
const filtered = computed(() => filterCatalogue(props.catalogue, query.value, status.value, category.value));
const counts = computed(() => statusCounts(props.catalogue));
function clearFilters(): void { query.value = ''; status.value = 'all'; category.value = 'all'; }
function csv(): void {
  downloadCatalogue('oas-trailmap-application-requirements.csv', catalogueCsv(props.catalogue), 'text/csv');
}
function json(): void {
  downloadCatalogue('oas-trailmap-application-requirements.json', catalogueJson(props.catalogue), 'application/json');
}
</script>

<template>
  <div class="section-heading"><div>
    <p class="eyebrow">PRODUCT DESIGN · DELIVERY STATUS · FUTURE ROADMAP</p>
    <h2>Application Requirements</h2>
    <p class="muted">A complete working register for OAS Trailmap <strong>the web application</strong> — distinct from the 142 Scout skill requirements. Track agreed capabilities, their implementation status and what to test.</p>
  </div></div>
  <div class="app-req-intro"><strong>How to read this page</strong>
    <p>“Implemented in code” means functionality can be located in the repository; it does <em>not</em> certify browser testing or readiness for deployment. “Partial” means gaps remain. “Planned” is agreed but incomplete. “Future idea” is brainstorming, not an approved commitment.</p>
  </div>
  <div id="appReqSummary" class="data-stats">
    <div class="data-stat"><strong>{{ catalogue.requirements.length }}</strong><span>Application requirements catalogued</span></div>
    <div v-for="s in statuses" :key="s" class="data-stat"><strong>{{ counts[s] }}</strong><span>{{ statusLabel(s) }}</span></div>
  </div>
  <div class="app-req-controls">
    <label>Search application requirements<input id="appReqSearch" v-model="query" type="search" placeholder="e.g., Excel, scheduler, backup, tags, APP-025"></label>
    <label>Delivery status<select id="appReqStatus" v-model="status">
      <option value="all">All statuses</option>
      <option value="implemented">Implemented in code</option>
      <option value="partial">Partially implemented</option>
      <option value="planned">Planned / not complete</option>
      <option value="future">Future ideas only</option>
    </select></label>
    <label>Feature area<select id="appReqCategory" v-model="category">
      <option value="all">All feature areas</option>
      <option v-for="(name, id) in catalogue.categories" :key="id" :value="id">{{ name }}</option>
    </select></label>
    <button id="appReqClear" type="button" class="button secondary" @click="clearFilters">Clear filters</button>
  </div>
  <div class="studio-toolbar">
    <button id="appReqExportCsv" class="button secondary" type="button" @click="csv">Export requirements CSV</button>
    <button id="appReqExportJson" class="button secondary" type="button" @click="json">Export requirements JSON</button>
    <a href="docs/application-requirements.md" class="button secondary" target="_blank" rel="noopener">Read written specification</a>
  </div>
  <p id="appReqResults" class="tiny muted" aria-live="polite">Showing {{ filtered.length }} of {{ catalogue.requirements.length }} requirements · statuses reflect code inspection, not end-to-end certification.</p>
  <div id="appReqList" class="app-req-list">
    <article v-for="item in filtered" :id="'application-'+item.id" :key="item.id" class="app-req-card">
      <div class="app-req-head">
        <div>
          <p class="app-req-id">{{ item.id }} · {{ catalogue.categories[item.category] || item.category }}</p>
          <h3>{{ item.title }}</h3>
        </div>
        <span :class="['app-req-status',item.status]">{{ statusLabel(item.status) }}</span>
      </div>
      <p>{{ item.description }}</p>
      <details>
        <summary>Implementation and verification</summary>
        <p><strong>Evidence in code / documentation:</strong><template v-for="(source, i) in item.implementation" :key="i">{{ ' ' }}<code>{{ source }}</code></template></p>
        <p><strong>How to verify:</strong> {{ item.verification || 'Not yet defined' }}</p>
        <p class="tiny muted">Repository evidence is not proof that every browser interaction or real-world workflow has passed testing.</p>
      </details>
    </article>
    <p v-if="!filtered.length" class="muted">No application requirements match. Try clearing one of the filters.</p>
  </div>
</template>
