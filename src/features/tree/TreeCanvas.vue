<script setup lang="ts">
import { computed, onMounted, onUpdated } from 'vue';
import type { TreeViewSnapshot } from './tree-view-model';

const props=defineProps<{
 state:{current:TreeViewSnapshot};
 selectNode:(id:string)=>void;
 quickLink:(id:string,action:string)=>void;
 dropNode:(id:string,target:string)=>void;
 paintEdges:()=>void;
}>();
const snapshot=computed(()=>props.state.current);
function nodeKey(event:KeyboardEvent,id:string):void {
 if(event.target!==event.currentTarget)return;
 if(event.key==='Enter'||event.key===' '){event.preventDefault();props.selectNode(id);}
}
function dragStart(event:DragEvent,id:string):void {
 if(!event.dataTransfer)return;
 event.dataTransfer.setData('text/plain',id);
 event.dataTransfer.effectAllowed='move';
}
function drop(event:DragEvent,target:string):void {
 event.preventDefault();
 const id=event.dataTransfer?.getData('text/plain')||'';
 if(id)props.dropNode(id,target);
}
function repaint():void { requestAnimationFrame(()=>props.paintEdges()); }
onMounted(repaint);
onUpdated(repaint);
</script>

<template>
  <div class="tree-view-note">
    <b>{{ snapshot.isTag?'Tag view:':'Skill tree:' }}</b>
    {{ ' '+snapshot.name+' · '+snapshot.count+' '+(snapshot.isTag?'matching skills across all trees.':'skills.') }}

  </div>
  <div class="tree-lanes">
    <div v-for="lane in snapshot.lanes" :key="lane.depth" class="tree-lane" :data-depth="lane.depth">
      <h3>{{ lane.depth===0?'Foundations':'Depth '+(lane.depth+1) }}</h3>
      <div v-for="card in lane.cards"
        :key="card.id"
        role="button" tabindex="0" draggable="true"
        :class="['tree-node',{active:card.active}]"
        :data-tree-id="card.id"
        :aria-label="'Select skill: '+card.text"
        :title="card.text"
        @click="selectNode(card.id)"
        @keydown="nodeKey($event,card.id)"
        @dragstart="dragStart($event,card.id)"
        @dragover.prevent
        @drop="drop($event,card.id)"
      >
        <strong>{{ card.text }}</strong>
        <small>{{ card.tree }} · Stage {{ card.stage }} · {{ card.readyCount }} ready</small>
        <small>{{ card.prerequisites }} mandatory · {{ card.recommended }} recommended</small>
        <div v-if="card.actions" class="tree-quick-actions">
          <button v-for="action in card.actions" :key="action.action"
            type="button"
            :class="['tree-quick-link',{unlink:action.unlink}]"
            :data-quick-link="action.action"
            :aria-label="action.label"
            :title="action.title"
            @click.stop="quickLink(card.id,action.action)"
          >{{ action.symbol }}</button>
        </div>
      </div>
    </div>
  </div>
  <svg id="treeEdges" class="tree-edges" aria-hidden="true"></svg>
</template>
