<script setup lang="ts">
import { computed, ref } from 'vue';
import { editorModeText } from './tree-editor-model';
import type { TreeEditorSnapshot } from './tree-editor-model';

const props = defineProps<{
  state:{current:TreeEditorSnapshot};
  save:(form:FormData)=>void;
  breakLink:(child:string,parent:string)=>void;
}>();
const current=computed(()=>props.state.current);
const tagsQuery=ref(''),linkQuery=ref('');
const filteredTags=computed(()=>current.value.tags.filter(t=>t.toLowerCase().includes(tagsQuery.value.toLowerCase())));
const filteredChoices=computed(()=>current.value.choices.filter(c=>(c.text+' '+c.id+' '+c.tree).toLowerCase().includes(linkQuery.value.toLowerCase())));
function submit(event:Event):void {
  event.preventDefault();
  const target=event.currentTarget;
  if(target instanceof HTMLFormElement)props.save(new FormData(target));
}
</script>

<template>
  <p v-if="!current.selected" class="muted">Select a skill. Click to edit; drag cards to rearrange. Recommended links remain advisory.</p>
  <template v-else>
    <h3>Edit requirement</h3>
    <p class="tiny muted">{{ editorModeText(current.custom) }}</p>
    <p class="tiny muted">{{ current.id }}</p>
    <section class="mapper-direct-links">
      <h4>Existing mandatory connections</h4>
      <p class="tiny muted">Break a specific link without removing other links. In a custom tree, these changes do not alter the master graph.</p>
      <strong>Parents of this skill</strong>
      <template v-if="current.parents.length">
        <div v-for="link in current.parents" :key="link.child+'|'+link.parent" class="mapper-link-row">
          <span>{{ link.label }}</span>
          <button class="button secondary" type="button"
            :data-break-child="link.child" :data-break-parent="link.parent"
            title="Break this prerequisite connection" aria-label="Remove prerequisite connection"
            @click="breakLink(link.child,link.parent)">× Remove</button>
        </div>
      </template>
      <p v-else class="tiny muted">None</p>
      <strong>Children of this skill</strong>
      <template v-if="current.children.length">
        <div v-for="link in current.children" :key="link.child+'|'+link.parent" class="mapper-link-row">
          <span>{{ link.label }}</span>
          <button class="button secondary" type="button"
            :data-break-child="link.child" :data-break-parent="link.parent"
            title="Break this prerequisite connection" aria-label="Remove prerequisite connection"
            @click="breakLink(link.child,link.parent)">× Remove</button>
        </div>
      </template>
      <p v-else class="tiny muted">None</p>
    </section>
    <form :key="current.id+'|'+current.tree+'|'+current.custom" id="editTreeForm" @submit="submit">
      <label>Preferred location
        <select name="preferredLocation" :value="current.preferred">
          <option v-for="location in current.places" :key="location" :value="location" :selected="location===current.preferred">{{ location }}</option>
        </select>
      </label>
      <fieldset><legend>Additional acceptable locations</legend>
        <div class="studio-tag-list">
          <label v-for="location in current.places" :key="location">
            <input type="checkbox" name="alternativeLocation" :value="location" :checked="current.alternatives.includes(location)">
            {{ location }}
          </label>
        </div>
      </fieldset>
      <fieldset><legend>Evidence opportunities (planning estimate)</legend>
        <label>Distinct nights/events needed
          <input name="requiredOccurrences" type="number" min="1" max="40" :value="current.occurrences">
        </label>
        <p class="tiny muted">Count basis: {{ current.occurrenceBasis }}. Change the number when additional opportunities are needed; requirement wording is unchanged.</p>
      </fieldset>
      <label>Name / requirement text
        <textarea name="text" rows="4" required :value="current.title"></textarea>
      </label>
      <label>Description
        <textarea name="description" rows="3" :value="current.description"></textarea>
      </label>
      <label>Tree
        <select name="tree" :value="current.tree">
          <option v-for="tree in current.treeOptions" :key="tree" :value="tree" :selected="tree===current.tree">{{ tree }}</option>
        </select>
      </label>
      <label>Stage <input name="stage" :value="current.stage" readonly></label>
      <fieldset><legend>Tags</legend><input v-for="tag in current.selectedTags.filter(t=>!filteredTags.includes(t))" :key="'keep-tag-'+tag" type="hidden" name="tags" :value="tag"><label>Search tags <input v-model="tagsQuery" type="search" placeholder="Filter tags"></label>
        <div class="studio-tag-list">
          <label v-for="tag in filteredTags" :key="tag">
            <input type="checkbox" name="tags" :value="tag" :checked="current.selectedTags.includes(tag)">
            {{ tag }}
          </label>
        </div>
      </fieldset>
      <label>Find prerequisite or recommended link <input v-model="linkQuery" type="search" placeholder="Search text, ID or tree"></label>
      <fieldset><legend>Mandatory prerequisites</legend><p v-if="Number(current.stage)===1" class="tiny muted">Stage 1 has no mandatory prerequisites.</p><input v-for="id in current.prerequisites.filter(id=>!filteredChoices.some(c=>c.id===id))" :key="'keep-parent-'+id" type="hidden" name="prerequisites" :value="id">
        <div class="studio-prereqs">
          <label v-for="choice in filteredChoices" :key="choice.id">
            <input type="checkbox" name="prerequisites" :value="choice.id" :checked="current.prerequisites.includes(choice.id)" :disabled="Number(current.stage)===1">
            {{ choice.text.slice(0,95) }} <small>({{ choice.tree }})</small>
          </label>
        </div>
      </fieldset>
      <fieldset><legend>Recommended learning links</legend><input v-for="id in current.recommended.filter(id=>!filteredChoices.some(c=>c.id===id))" :key="'keep-recommended-'+id" type="hidden" name="recommended" :value="id">
        <div class="studio-prereqs">
          <label v-for="choice in current.choices" :key="choice.id">
            <input type="checkbox" name="recommended" :value="choice.id" :checked="current.recommended.includes(choice.id)">
            {{ choice.text.slice(0,95) }}
          </label>
        </div>
      </fieldset>
      <button class="button primary" type="submit">Save requirement</button>
    </form>
  </template>
</template>
