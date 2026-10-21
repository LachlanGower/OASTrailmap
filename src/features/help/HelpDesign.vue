<script setup lang="ts">
import { computed, ref } from 'vue';

import type { HelpTopic } from './types';
const props = defineProps<{
  topics: HelpTopic[];
  renderArticle: (topic: HelpTopic) => string;
}>();
const query = ref('');
const selectedId = ref('');
const filtered = computed(() => props.topics.filter(t =>
  (t.title + ' ' + t.group + ' ' + t.text).toLowerCase().includes(query.value.toLowerCase())
));
const activeTopic = computed(() => filtered.value.find(t => t.id === selectedId.value)
  ?? filtered.value[0]);
function search(): void {
  // The legacy helpRender() selects the first filtered topic on every input.
  selectedId.value = filtered.value[0]?.id ?? '';
}
function open(id: string): void { selectedId.value = id; }
</script>

<template>
  <div class="section-heading"><div>
    <p class="eyebrow">GETTING STARTED · WORKFLOWS · DESIGN</p>
    <h2>Help &amp; Design</h2>
    <p class="muted">Practical help for leaders, and a technical appendix for maintainers. Future ideas here are brainstorming, not approved requirements.</p>
  </div></div>
  <label>Search help topics <input id="helpSearch" v-model="query" type="search" placeholder="Try Excel import, activities, backups or the roadmap" @input="search"></label>
  <div id="helpTopics" class="help-topics">
    <button v-for="topic in filtered" :key="topic.id" type="button" class="button secondary"
      :data-help="topic.id" @click="open(topic.id)">{{ topic.title }}</button>
    <p v-if="!filtered.length">No matching help topics. Try a simpler term.</p>
  </div>
  <div id="helpContent" class="help-content" v-html="activeTopic ? renderArticle(activeTopic) : ''"></div>
</template>
