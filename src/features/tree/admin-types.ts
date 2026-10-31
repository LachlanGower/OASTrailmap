export interface TreeAdminSnapshot {
 trees:string[];
 tags:string[];
 active:string;
 graphMode:'master'|'custom';
 isTag:boolean;
 graphHint:string;
}
export interface TreeCheckpoint {
 index:number;
 title:string;
 at:string;
}
export type TreeAdminAction = 'tree'|'mode'|'new'|'rename'|'delete'|'tags'|'snapshot'|'history'|'export'|'import';
export function treeAdminSnapshot(
  trees:readonly string[],tags:readonly string[],active:string,
  graphMode:'master'|'custom'
):TreeAdminSnapshot {
 const isTag=active.startsWith('tag::');
 return {
  trees:[...trees],tags:[...tags],active,
  graphMode:isTag?'master':graphMode,isTag,
  graphHint:isTag?'Tag views show the master relationship graph.':
   graphMode==='custom'
    ?'Editing this tree’s own prerequisite links; the master and Scout progress stay unchanged.'
    :'Editing shared master links, which drive Scout progress and scheduling.'
 };
}
