import type { OasRequirement } from './models.js';

export type TreeNodeLinks = { prerequisites: string[]; suggested_links: Array<{id:string;reason?:string}> };
export interface TreeLayer { mode?: 'master' | 'custom'; nodes?: Record<string, Partial<TreeNodeLinks>>; }
export type TreeGraphLayers = Record<string, TreeLayer>;

/** Master skill links never silently change when a tree has a private layer. */
export function mapperLinks(
  requirement: OasRequirement, treeName: string, layers: TreeGraphLayers
): TreeNodeLinks {
  const override = !treeName.startsWith('tag::') && layers[treeName]?.mode === 'custom'
    ? layers[treeName]?.nodes?.[requirement.id] : undefined;
  return {
    prerequisites: override ? [...(override.prerequisites ?? [])] : [...requirement.prerequisites],
    suggested_links: override ? [...(override.suggested_links ?? [])] : [...(requirement.suggested_links ?? [])]
  };
}

/** Reject missing IDs, self-dependencies and mandatory cycles, never advisory cycles. */
export function validateProposedMandatoryLinks(
  requirements: readonly OasRequirement[], editedId: string, parents: readonly string[],
  treeName: string, layers: TreeGraphLayers
): void {
  const ids=new Set(requirements.map(r=>r.id));
  if(!ids.has(editedId)) throw new Error('Unknown edited requirement: '+editedId);
  for(const parent of parents) {
    if(!ids.has(parent)) throw new Error('Missing mandatory prerequisite: '+parent);
    if(parent===editedId)throw new Error('Self prerequisite for '+editedId);
  }
  const graph=new Map(requirements.map(r=>[r.id,
    r.id===editedId ? [...parents] : mapperLinks(r,treeName,layers).prerequisites]));
  const visiting=new Set<string>(),done=new Set<string>();
  function visit(id:string):void{
    if(visiting.has(id))throw new Error('Circular mandatory prerequisite at '+id);
    if(done.has(id))return;
    visiting.add(id);
    for(const parent of graph.get(id) ?? []) {
      if(!graph.has(parent))throw new Error('Missing mandatory prerequisite: '+parent);
      visit(parent);
    }
    visiting.delete(id);done.add(id);
  }
  for(const id of graph.keys())visit(id);
}

export function prerequisiteDependents(
  requirements: readonly OasRequirement[], id: string, treeName: string,
  layers: TreeGraphLayers
): string[] {
  const found=new Set<string>(),todo=[id];
  while(todo.length){
    const target=todo.pop()!;
    for(const r of requirements) {
      if(found.has(r.id)||r.id===id)continue;
      if(mapperLinks(r,treeName,layers).prerequisites.includes(target)) {
        found.add(r.id);todo.push(r.id);
      }
    }
  }
  return [...found];
}
