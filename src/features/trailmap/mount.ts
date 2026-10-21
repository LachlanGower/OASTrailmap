import { createApp, shallowReactive } from 'vue';
import RequirementMap from './RequirementMap.vue';
import type { RequirementMapSnapshot } from './map-model';

declare global {
  interface Window {
    __oasTrailmapSnapshot?: () => RequirementMapSnapshot;
    __oasTrailmapVueRender?: (snapshot: RequirementMapSnapshot) => boolean;
    __oasTrailmapSelect?: (id: string) => void;
    __oasTrailmapDrawRelated?: () => void;
    __oasTrailmapLegacyRender?: () => void;
  }
}

/**
 * Vue owns #mapCanvas only. The original Scout toolbar, details, evidence,
 * imports, and browser storage continue to use the exact legacy code.
 *
 * ?trailmapRenderer=legacy keeps the original map, with zero changes to data.
 * If a dependency does not initialize, the original map remains visible.
 */
export function mountTrailmap(): void {
  if (new URLSearchParams(window.location.search).get('trailmapRenderer') === 'legacy') return;
  const canvas = document.querySelector<HTMLElement>('#mapCanvas');
  if (!canvas) return;
  let attempts = 0;
  const timer = window.setInterval(() => {
    if (!canvas.isConnected || attempts++ > 330) {
      window.clearInterval(timer);
      return;
    }
    if (!window.__oasTrailmapSnapshot || !window.__oasTrailmapSelect ||
        !window.__oasTrailmapDrawRelated || !window.__oasTrailmapLegacyRender ||
        !canvas.querySelector('.requirement-node')) return;
    window.clearInterval(timer);

    const previousHtml = canvas.innerHTML;
    const state = shallowReactive({ current: window.__oasTrailmapSnapshot() });
    try {
      createApp(RequirementMap, {
        state,
        onSelect: (id: string) => window.__oasTrailmapSelect?.(id),
        onPaint: () => window.__oasTrailmapDrawRelated?.()
      }).mount(canvas);
      window.__oasTrailmapVueRender = snapshot => {
        state.current = snapshot;
        return true;
      };
      document.documentElement.dataset.oasTrailmapRenderer = 'vue';
    } catch (error) {
      console.warn('Vue map unavailable; returning to original renderer.', error);
      window.__oasTrailmapVueRender = undefined;
      canvas.innerHTML = previousHtml;
      window.__oasTrailmapLegacyRender?.();
    }
  }, 60);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountTrailmap, { once: true });
} else {
  mountTrailmap();
}
