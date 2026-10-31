<script setup lang="ts">
import {computed,ref} from 'vue';
import type {TreeAdminAction,TreeAdminSnapshot} from './admin-types';
const props=defineProps<{
 state:{current:TreeAdminSnapshot};
 trigger:(action:TreeAdminAction,event:Event)=>void;
}>();
const view=computed(()=>props.state.current);
const search=ref('');
const shownTrees=computed(()=>view.value.trees.filter(t=>t.toLowerCase().includes(search.value.toLowerCase())));
const shownTags=computed(()=>view.value.tags.filter(t=>t.toLowerCase().includes(search.value.toLowerCase())));
function call(action:TreeAdminAction,event:Event):void {
 props.trigger(action,event);
}
</script>

<template>
  <div class="studio-toolbar" data-oas-tree-admin-renderer="vue">
    <label>View tree or tag
      <select id="treeSelect" :value="view.active" @change="call('tree',$event)">
        <optgroup label="Skill trees">
          <option v-for="tree in shownTrees" :key="tree" :value="tree">{{ tree }}</option>
        </optgroup>
        <optgroup label="Tag views">
          <option v-for="tag in shownTags" :key="tag" :value="'tag::'+tag"># {{ tag }}</option>
        </optgroup>
      </select>
    </label>
    <label>Search trees and tags <input v-model="search" type="search" placeholder="Filter tree or tag names"></label>
    <label>Links to edit
      <select id="treeGraphMode" :value="view.graphMode" :disabled="view.isTag" @change="call('mode',$event)">
        <option value="master">Master prerequisite tree</option>
        <option value="custom">This tree’s own links</option>
      </select>
    </label>
    <span id="treeGraphHint" class="tree-graph-hint">{{ view.graphHint }}</span>
    <div class="tree-management-actions">
    <button id="newTree" class="button secondary" @click="call('new',$event)">New tree</button>
    <button id="renameTree" class="button secondary" :disabled="view.isTag" @click="call('rename',$event)">Rename tree</button>
    <button id="deleteTree" class="button secondary" :disabled="view.isTag||view.trees.length<2" @click="call('delete',$event)">Delete tree</button>
    <button id="manageTags" class="button secondary" @click="call('tags',$event)">Manage tags</button>
    <button id="treeSnapshot" hidden class="button secondary" @click="call('snapshot',$event)">Save snapshot</button>
    <button id="historyBtn" hidden class="button secondary" @click="call('history',$event)">History / rollback</button>
    <button id="exportRequirements" hidden class="button primary" @click="call('export',$event)">Export requirements.yaml</button>
    <label hidden class="button secondary file-button" for="importRequirements">Import requirements</label>
    <input id="importRequirements" type="file" accept=".yaml,.yml,.json" hidden @change="call('import',$event)">
    </div>
  </div>
</template>
