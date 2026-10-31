<script setup lang="ts">
/**
 * Vue owns the seven navigation buttons and the shared shell markup.
 * Until each workspace is migrated, the original, already-initialised legacy
 * handlers remain the single authority for activating workspaces.
 */
import type { NavigationAction } from './types';
const props = defineProps<{
  actions: Record<NavigationAction, (event: MouseEvent) => void>;
  initialSaveStatus: string;
  initialClasses: Record<NavigationAction, string>;
}>();
function dispatch(action: NavigationAction, event: MouseEvent): void { props.actions[action](event); if(action!=='undo'){const nav=(event.currentTarget as HTMLElement).closest('nav');nav?.querySelectorAll('button').forEach(b=>{b.classList.toggle('primary',b===event.currentTarget);b.classList.toggle('secondary',b!==event.currentTarget);});} }
function classesFor(action: NavigationAction): string {
  return ['trail','tree','schedule','weeklyThemes','tracker','activity','data','help','requirements'].includes(action) ? 'button '+(action==='trail'?'primary':'secondary') : props.initialClasses[action];
}
</script>

<template>
  <nav class="studio-nav" aria-label="Workspace modes" data-oas-nav-renderer="vue">
    <button :class="classesFor('trail')" data-mode="trail" @click="dispatch('trail', $event)">Trailmap</button>
    <button :class="classesFor('tree')" data-mode="tree" @click="dispatch('tree', $event)">Skill Tree Mapper</button>
    <button :class="classesFor('schedule')" data-mode="schedule" @click="dispatch('schedule', $event)">40-week Scheduler</button>
    <button :class="classesFor('weeklyThemes')" type="button" id="weeklyThemesTab" @click="dispatch('weeklyThemes', $event)">Weekly Themes</button>
    <button :class="classesFor('tracker')" type="button" id="requirementsTrackerTab" @click="dispatch('tracker', $event)">Requirements Tracker</button>
    <button :class="classesFor('activity')" type="button" id="activityStudioTab" @click="dispatch('activity', $event)">Activity Studio</button>
    <button :class="classesFor('data')" type="button" id="dataManagerTab" @click="dispatch('data', $event)">Data &amp; State</button>
    <button :class="classesFor('help')" type="button" id="helpDesignTab" @click="dispatch('help', $event)">Help &amp; Design</button>
    <button :class="classesFor('requirements')" type="button" id="appRequirementsTab" @click="dispatch('requirements', $event)">Application Requirements</button>
    <span id="localSaveStatus" class="tiny muted" role="status">{{ initialSaveStatus }}</span>
    <button id="undoLastEdit" hidden type="button" :class="classesFor('undo')" @click="dispatch('undo',$event)" aria-hidden="true">Undo tree edit</button>
  </nav>
</template>
