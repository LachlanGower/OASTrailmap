import type {OasRequirement} from './models.js';
/** Recommendations are readiness dependencies unless explicitly made advisory. */
export function planningPrerequisites(r:OasRequirement):string[]{return [...new Set([...r.prerequisites,...(r.recommended_as_prerequisites===false?[]:(r.suggested_links??[]).map(l=>l.id))])];}
