import '../../../js/requirement-inspector.js';
import '../../../js/weekly-themes.js';
import '../data-state/mount';
import '../activity/mount';
import '../scheduler/mount';
import '../tree/admin-mount';
import '../tree/editor-mount';
import '../tree/mount';
import '../workbook/mount';
import '../scouts/mount';
import '../trailmap/mount';
import '../help/mount';
import '../navigation/mount';
import { createApp } from 'vue';
import ApplicationRequirements from './ApplicationRequirements.vue';
import { parseCatalogue } from './catalogue';

declare global {
  interface Window { __oasAppReqVueActive?: boolean; }
}

/**
 * Progressive Vue island: mount a complete replacement of the existing
 * Application Requirements *section*, only after the public catalogue validates.
 *
 * A failed import, a broken bundle, or ?appReqRenderer=legacy retains the
 * original HTML/JS implementation. Scout data is never accessed here.
 */
async function boot(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  if (params.get('appReqRenderer') === 'legacy') return;
  const oldSection = document.querySelector<HTMLElement>('#applicationRequirements');
  if (!oldSection) return;
  try {
    const response = await fetch('data/application-requirements.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const catalogue = parseCatalogue(await response.json() as unknown);
    const replacement = oldSection.cloneNode(false) as HTMLElement;
    const initialQuery = (oldSection.querySelector('#appReqSearch') as HTMLInputElement | null)?.value ?? '';
    const initialStatus = (oldSection.querySelector('#appReqStatus') as HTMLSelectElement | null)?.value ?? 'all';
    const initialCategory = (oldSection.querySelector('#appReqCategory') as HTMLSelectElement | null)?.value ?? 'all';
    createApp(ApplicationRequirements, { catalogue, initialQuery, initialStatus, initialCategory })
      .mount(replacement);

    // Swap only after Vue successfully mounted; older listeners reference
    // lookups, not the former panel. Existing tab/navigation remains legacy.
    window.__oasAppReqVueActive = true;
    oldSection.replaceWith(replacement);
    document.documentElement.dataset.appRequirementsRenderer = 'vue';
  } catch (error) {
    // Do not destroy the legacy section or overwrite the browser's saved data.
    console.warn('Vue app requirements view unavailable; using legacy renderer.', error);
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { void boot(); }, { once: true });
} else {
  void boot();
}
