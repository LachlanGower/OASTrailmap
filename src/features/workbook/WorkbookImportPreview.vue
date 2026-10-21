<script setup lang="ts">
import { uniqueEvidencePairs } from './workbook-parser';
import type { WorkbookPreviewData } from './workbook-parser';
defineProps<{
  filename:string;
  preview:WorkbookPreviewData;
  onApply:()=>void;
  onCancel:()=>void;
}>();
</script>

<template>
  <h3>Workbook import preview</h3>
  <p>
    <b>{{ filename }}</b> · {{ preview.scouts.length }} Scouts ·
    {{ preview.rows.length }} completed cells across
    {{ uniqueEvidencePairs(preview.rows) }} Scout/requirement pairs ·
    {{ preview.unmatched.length }} workbook rows not found verbatim in the requirements source.
  </p>
  <p>Import adds completion evidence and will not clear existing manual records. Where a cell has both a date and a highlight, the date is retained. Unmatched rows are added as clearly labelled workbook-specific requirements so their evidence is not lost.</p>
  <div v-if="preview.unmatched.length" class="preview-table-wrap">
    <table class="preview-table">
      <thead><tr><th>Sheet</th><th>Row</th><th>Workflow</th><th>Requirement text</th></tr></thead>
      <tbody>
        <tr v-for="row in preview.unmatched.slice(0,80)" :key="row.sheet+'|'+row.row">
          <td>{{ row.sheet }}</td><td>{{ row.row }}</td><td>{{ row.workflow }}</td>
          <td><span class="tag-warning">Workbook-only</span> {{ row.text }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else>No unmatched requirement rows found.</p>
  <div class="preview-actions">
    <button id="applyWorkbook" class="button primary" type="button" @click="onApply">Apply import</button>
    <button id="cancelWorkbook" class="button secondary" type="button" @click="onCancel">Cancel</button>
  </div>
</template>
