import { createApp } from 'vue';
import HelpDesign from './HelpDesign.vue';
import type { HelpTopic } from './types';

declare global {
  interface Window {
    __oasHelpVueActive?: boolean;
    __oasPublicHelpTopics?: HelpTopic[];
    docsDiagram?: (id: string) => string;
    docsFormat?: (text: string, id: string) => string;
  }
}
function escapeHelp(text: string): string {
  return String(text ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] ?? c));
}
function mountHelp(): void {
  if (window.__oasHelpVueActive) return;
  if (new URLSearchParams(location.search).get('helpRenderer') === 'legacy') return;
  const oldSection=document.querySelector<HTMLElement>('#helpDesign');
  if (!oldSection) return;
  const topics=window.__oasPublicHelpTopics;
  if (!Array.isArray(topics) || !topics.length ||
      typeof window.docsDiagram !== 'function' ||
      typeof window.docsFormat !== 'function') return; // Leave the original help view.
  const replacement=oldSection.cloneNode(false) as HTMLElement;
  const renderArticle=(topic: HelpTopic):string =>
    '<article class="docs-article" data-help-open="'+escapeHelp(topic.id)+'">' +
    '<p class="eyebrow">'+escapeHelp(topic.group)+'</p><h3>'+escapeHelp(topic.title)+'</h3>' +
    window.docsDiagram!(topic.id)+window.docsFormat!(topic.text,topic.id)+'</article>';
  try {
    createApp(HelpDesign,{topics,renderArticle}).mount(replacement);
    oldSection.replaceWith(replacement);
    window.__oasHelpVueActive=true;
    document.documentElement.dataset.oasHelpRenderer='vue';
  } catch(error) {
    console.warn('Vue Help view unavailable; retaining legacy Help & Design.',error);
  }
}
window.addEventListener('oas:help-topics-ready',mountHelp);
if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',mountHelp,{once:true});
else mountHelp();
