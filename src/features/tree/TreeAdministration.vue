<script setup lang="ts">
import {computed} from 'vue';
import type {TreeAdminAction,TreeAdminSnapshot} from './admin-types';
const props=defineProps<{
 state:{current:TreeAdminSnapshot};
 trigger:(action:TreeAdminAction,event:Event)=>void;
}>();
const view=computed(()=>props.state.current);
function call(action:TreeAdminAction,event:Event):void {
 props.trigger(action,event);
}
</script>

<template>
  <div class="studio-toolbar" data-oas-tree-admin-renderer="vue">
    <label>View tree or tag
      <select id="treeSelect" :value="view.active" @change="call('tree',$event)">
        <optgroup label="Skill trees">
          <option v-for="tree in view.trees" :key="tree" :value="tree">{{ tree }}</option>
        </optgroup>
        <optgroup label="Tag views">
          <option v-for="tag in view.tags" :key="tag" :value="'tag::'+tag"># {{ tag }}</option>
        </optgroup>
      </select>
    </label>
    <label>Links to edit
      <select id="treeGraphMode" :value="view.graphMode" :disabled="view.isTag" @change="call('mode',$event)">
        <option value="master">Master prerequisite tree</option>
        <option value="custom">This tree’s own links</option>
      </select>
    </label>
    <span id="treeGraphHint" class="tree-graph-hint">{{ view.graphHint }}</span>
    <button id="newTree" class="button secondary" @click="call('new',$event)">New tree</button>
    <button id="renameTree" class="button secondary" :disabled="view.isTag" @click="call('rename',$event)">Rename tree</button>
    <button id="manageTags" class="button secondary" @click="call('tags',$event)">Tag library</button>
    <button id="treeSnapshot" class="button secondary" @click="call('snapshot',$event)">Save snapshot</button>
    <button id="historyBtn" class="button secondary" @click="call('history',$event)">History / rollback</button>
    <button id="exportRequirements" class="button primary" @click="call('export',$event)">Export requirements.yaml</button>
    <label class="button secondary file-button" for="importRequirements">Import YAML</label>
    <input id="importRequirements" type="file" accept=".yaml,.yml,.json" hidden @change="call('import',$event)">
  </div>
</template>
