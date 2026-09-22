import { authFetch } from './authService';
export type DemoTask={id:string;title:string;done:boolean;createdAt:string};
async function json(r:Response){const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'request_failed');return data}
export async function listDemoTasks():Promise<DemoTask[]>{return json(await authFetch('/demo/tasks'))}
export async function createDemoTask(title:string):Promise<DemoTask>{return json(await authFetch('/demo/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title})}))}
export async function updateDemoTask(id:string,done:boolean):Promise<DemoTask>{return json(await authFetch('/demo/tasks/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({done})}))}
export async function deleteDemoTask(id:string){return json(await authFetch('/demo/tasks/'+encodeURIComponent(id),{method:'DELETE'}))}
export async function apiHealth(){return json(await fetch((process.env.EXPO_PUBLIC_API_URL??'http://localhost:3000')+'/health'))}

export type InspectResult={method:string;received:any;requestId:string;serverTime:string;latencyHint:string};
export async function inspectApi(payload:any):Promise<InspectResult>{return json(await authFetch('/demo/inspect',{method:'POST',headers:{'Content-Type':'application/json','X-Portfolio-Demo':'api-inspector'},body:JSON.stringify(payload)}))}

export type DemoUpload={id:string;name:string;mime:string;size:number;createdAt:string};
export async function listUploads():Promise<DemoUpload[]>{return json(await authFetch('/demo/uploads'))}
export async function uploadFile(file:{name:string;mime:string;size:number;data:string}):Promise<DemoUpload>{return json(await authFetch('/demo/uploads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(file)}))}
export async function deleteUpload(id:string){return json(await authFetch('/demo/uploads/'+encodeURIComponent(id),{method:'DELETE'}))}

export type RealtimeEvent={id:string;message:string;time:string};
export async function sendRealtimeEvent(message:string):Promise<RealtimeEvent>{return json(await authFetch('/demo/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})}))}
export async function openRealtimeStream(signal:AbortSignal,onEvent:(e:RealtimeEvent)=>void){const r=await authFetch('/demo/events',{signal});if(!r.ok||!r.body)throw new Error('stream_failed');const reader=r.body.getReader();const decoder=new TextDecoder();let buffer='';while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const chunks=buffer.split('\n\n');buffer=chunks.pop()??'';for(const chunk of chunks){if(!chunk.includes('event: notification'))continue;const line=chunk.split('\n').find(x=>x.startsWith('data: '));if(line)onEvent(JSON.parse(line.slice(6)))}}}
export type AIResult={summary:string;provider:string;category:string;keywords:string[];inputChars:number};
export async function analyzeText(text:string):Promise<AIResult>{return json(await authFetch('/demo/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})}))}
