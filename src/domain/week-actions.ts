import type { PlannedWeek } from './models.js';
export function swapScheduleWeeks(weeks:readonly PlannedWeek[],source:number,target:number):PlannedWeek[]{
 if(!Number.isInteger(source)||!Number.isInteger(target)||source<0||target<0||source>=weeks.length||target>=weeks.length||source===target)throw new Error('Choose two different existing weeks.');
 if(weeks[source].locked||weeks[target].locked)throw new Error('Unlock both weeks before swapping.');
 const next=[...weeks];[next[source],next[target]]=[next[target],next[source]];return next;
}
