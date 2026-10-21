/** Rendering-only model; mandatory links remain owned by the legacy graph engine. */
export interface TreeCard {
 id:string;
 text:string;
 tree:string;
 stage:number|string;
 depth:number;
 readyCount:number;
 prerequisites:number;
 recommended:number;
 active:boolean;
 actions:TreeAction[] | null;
}
export interface TreeAction { action:'parent'|'child'|'remove-parent'|'remove-child'; label:string; title:string; symbol:'↑'|'↓'|'×'; unlink:boolean }
export interface TreeLane { depth:number; cards:TreeCard[] }
export interface TreeViewSnapshot {
 isTag:boolean; name:string; count:number; lanes:TreeLane[];
}
export function treeNote(s:TreeViewSnapshot):string {
 return s.isTag?`Tag view: ${s.name} · ${s.count} matching skills across all trees.`:
  `Skill tree: ${s.name} · ${s.count} skills.`;
}
export function actionFor(isParent:boolean,isChild:boolean):TreeAction[]{
 return [
  {action:isParent?'remove-parent':'parent',
   label:(isParent?'Remove as parent of':'Add as parent of')+' selected skill',
   title:isParent?'Break parent link':'Add as parent',
   symbol:isParent?'×':'↑',unlink:isParent},
  {action:isChild?'remove-child':'child',
   label:(isChild?'Remove as child of':'Add as child of')+' selected skill',
   title:isChild?'Break child link':'Add as child',
   symbol:isChild?'×':'↓',unlink:isChild}
 ];
}
export function canMoveWithinDepth(snapshot:TreeViewSnapshot,id:string,target:string):boolean {
 const lookup=new Map(snapshot.lanes.flatMap(lane=>lane.cards.map(card=>[card.id,lane.depth] as const)));
 return id!==target&&lookup.has(id)&&lookup.get(id)===lookup.get(target);
}
