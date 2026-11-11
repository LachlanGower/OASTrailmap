import type {OasRequirement} from './models.js';
/** Resolve transitive duplicate groups without merging curriculum records or Scout evidence. */
export function duplicateGroups(requirements:readonly OasRequirement[]):Map<string,string>{
 const parent=new Map(requirements.map(r=>[r.id,r.id]));
 function root(id:string):string{let current=id;const seen=new Set<string>();while(parent.get(current)&&parent.get(current)!==current&&!seen.has(current)){seen.add(current);current=parent.get(current)!;}return current;}
 for(const r of requirements)if(r.duplicate_of&&parent.has(r.duplicate_of)){const a=root(r.id),b=root(r.duplicate_of);if(a!==b)parent.set(a,b);}
 return new Map(requirements.map(r=>[r.id,root(r.id)]));
}
