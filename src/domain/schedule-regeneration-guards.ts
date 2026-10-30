/** Pure checks before a scheduler proposal is applied. No writes or Scout records. */
export interface ScheduleWeekGuard { locked?:boolean; requirementIds?:string[]; [key:string]:unknown }
export function inspectRegeneration(previous:readonly ScheduleWeekGuard[], proposed:readonly ScheduleWeekGuard[]):{changed:number;locked:number}{
 if(proposed.length<1||proposed.length>60)throw Error('Schedule must contain between 1 and 60 weeks.');
 let changed=0,locked=0;
 for(let i=0;i<previous.length;i++){
  const before=previous[i],after=proposed[i];
  if(before.locked){
   if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Locked week '+(i+1)+' changed during regeneration.');
   locked++;
  }else if(JSON.stringify(before.requirementIds||[])!==JSON.stringify(after?.requirementIds||[]))changed++;
 }
 for(let i=previous.length;i<proposed.length;i++)if(proposed[i].requirementIds?.length)changed++;
 return {changed,locked};
}
export function assertUnchangedSincePreview(expected:string,current:unknown):void{
 if(JSON.stringify(current)!==expected)throw Error('Schedule changed after preview. Regenerate again before applying.');
}
