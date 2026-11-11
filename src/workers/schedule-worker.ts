import { generateSchedule } from '../domain/schedule-engine';
import type { ScheduleJob,ScheduleJobResult } from '../domain/schedule-worker-messages';
const send=(message:ScheduleJobResult)=>self.postMessage(message);
self.onmessage=(event:MessageEvent<ScheduleJob>)=>{
 const {requirements,records,studio,scouts,keepLocks,activities}=event.data;
 try{const weeks=generateSchedule(requirements,records,studio,scouts,keepLocks,activities,(week,total)=>send({type:'progress',week,total}));send({type:'complete',weeks});}
 catch(error){send({type:'error',message:error instanceof Error?error.message:String(error)});}
};
