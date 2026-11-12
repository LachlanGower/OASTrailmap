import type { OasRequirement } from './models.js';
import { validateRequirements } from './requirements.js';
export interface CurriculumDraft {stage:number;themes:string[];preferred:string;alternatives:string[];prerequisites:string[];suggested:string[];duplicateOf?:string;duplicateIds?:string[];recommendationsArePrerequisites?:boolean}
/** Keep identity, evidence keys and unknown curriculum metadata intact. */
export function editCurriculum(requirements:readonly OasRequirement[],id:string,draft:CurriculumDraft):OasRequirement[]{
 if(![1,2,3].includes(draft.stage))throw new Error('Choose Stage 1, 2 or 3.');
 const original=requirements.find(r=>r.id===id);if(!original)throw new Error('Statement no longer exists.');
 if([...draft.prerequisites,...draft.suggested].includes(id))throw new Error('A statement cannot link to itself.');
 const clean=(values:string[])=>[...new Set(values.map(v=>v.trim()).filter(Boolean))];
 const next=requirements.map(r=>r.id!==id?r:{...r,stage:draft.stage,recommended_as_prerequisites:draft.recommendationsArePrerequisites??r.recommended_as_prerequisites,duplicate_of:draft.duplicateIds!==undefined?undefined:draft.duplicateOf===undefined?r.duplicate_of:(draft.duplicateOf.trim()||undefined),duplicates:draft.duplicateIds===undefined?r.duplicates:clean(draft.duplicateIds),tags:clean(draft.themes),theme_tags:clean(draft.themes),locations:{...(r.locations as object??{}),preferred:draft.preferred.trim(),alternatives:clean(draft.alternatives).filter(l=>l!==draft.preferred.trim())},prerequisites:clean(draft.prerequisites),suggested_links:clean(draft.suggested).map(id=>r.suggested_links?.find(l=>l.id===id)??{id})});
 validateRequirements(next);return next;
}
