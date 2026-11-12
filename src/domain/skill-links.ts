import type {OasRequirement} from './models.js';
import {validateRequirements} from './requirements.js';
export type LinkKind='required'|'recommended';
export function editSkillLink(requirements:readonly OasRequirement[],child:string,parent:string,kind:LinkKind,remove=false):OasRequirement[]{
 if(!['required','recommended'].includes(kind))throw new Error('Choose a link type.');
 if(child===parent)throw new Error('A statement cannot depend on itself.');
 if(!requirements.some(r=>r.id===child)||!requirements.some(r=>r.id===parent))throw new Error('Choose two existing statements.');
 const next=requirements.map(r=>r.id!==child?r:{...r,prerequisites:kind==='required'?(remove?r.prerequisites.filter(id=>id!==parent):[...new Set([...r.prerequisites,parent])]):r.prerequisites,suggested_links:kind==='recommended'?(remove?(r.suggested_links??[]).filter(l=>l.id!==parent):[...(r.suggested_links??[]).filter(l=>l.id!==parent),r.suggested_links?.find(l=>l.id===parent)??{id:parent}]):r.suggested_links});
 validateRequirements(next);return next;
}
