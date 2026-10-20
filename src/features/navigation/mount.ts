import { createApp } from 'vue';
import NavigationShell from './NavigationShell.vue';
import type { NavigationAction } from './types';

/** The original IDs are the bridge contract until all workspaces use Vue. */
const sources: Record<NavigationAction, string> = {
  trail: '[data-mode="trail"]',
  tree: '[data-mode="tree"]',
  schedule: '[data-mode="schedule"]',
  activity: '#activityStudioTab',
  data: '#dataManagerTab',
  help: '#helpDesignTab',
  requirements: '#appRequirementsTab',
  undo: '#undoLastEdit'
};
const actions = Object.keys(sources) as NavigationAction[];

export function mountLegacyNavigation(): void {
  if (new URLSearchParams(location.search).get('navRenderer') === 'legacy') return;
  const oldNav = document.querySelector<HTMLElement>('nav.studio-nav');
  if (!oldNav) return;

  // Legacy studio/data/help/register handlers initialise at different times.
  // Never swap a usable navigation bar before all of them are ready.
  const startedAt = Date.now();
  const timer = window.setInterval(() => {
    if (!oldNav.isConnected) { clearInterval(timer); return; }
    if (Date.now() - startedAt > 20000) { clearInterval(timer); return; }
    const original = Object.fromEntries(actions.map(action =>
      [action, oldNav.querySelector<HTMLButtonElement>(sources[action])])) as Record<NavigationAction, HTMLButtonElement | null>;
    if (actions.some(action => typeof original[action]?.onclick !== 'function')) return;
    clearInterval(timer);
    const handlers = Object.fromEntries(actions.map(action => {
      const button = original[action]!;
      const originalClick = button.onclick!;
      return [action, (event: MouseEvent) => { originalClick.call(button, event); }];
    })) as Record<NavigationAction, (event: MouseEvent) => void>;
    const classes = Object.fromEntries(actions.map(action =>
      [action, original[action]!.className])) as Record<NavigationAction, string>;
    const replacement = document.createElement('div');
    const initialSaveStatus = oldNav.querySelector('#localSaveStatus')?.textContent ?? 'Local';
    try {
      createApp(NavigationShell, { actions: handlers, initialClasses: classes, initialSaveStatus })
        .mount(replacement);
      const vueNav = replacement.firstElementChild;
      if (!(vueNav instanceof HTMLElement) || vueNav.tagName !== 'NAV')
        throw new Error('The Vue navigation shell did not mount correctly');
      oldNav.replaceWith(vueNav);
      document.documentElement.dataset.oasNavRenderer = 'vue';
    } catch (error) {
      console.warn('Vue navigation unavailable; retaining original navigation.', error);
    }
  }, 60);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLegacyNavigation, {once:true});
} else {
  mountLegacyNavigation();
}
