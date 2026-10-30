/**
 * The mapper editor is a view of the original JS graph. No independent graph
 * store: mutations are passed to legacy cycle checks and snapshot/rollback.
 */
export interface EditorChoice { id:string; text:string; tree:string }
export interface EditorLink { child:string; parent:string; label:string }
export interface TreeEditorSnapshot {
 selected: boolean;
 id:string; title:string; description:string; tree:string; stage:string;
 custom:boolean; treeOptions:string[]; tags:string[]; selectedTags:string[];
 places:string[]; preferred:string; alternatives:string[];
 occurrences:number; occurrenceBasis:string;
 prerequisites:string[]; recommended:string[]; choices:EditorChoice[];
 parents:EditorLink[]; children:EditorLink[];
}
export function safeOccurrenceCount(value:unknown):number {
 return Math.max(1,Math.min(40,Number(value)||1));
}
/** Never silently treat recommended connections as mandatory ones. */
export function editorModeText(custom:boolean):string {
 return custom?'Prerequisite links here are private to this tree.':
  'Prerequisite links here change the shared master.';
}
