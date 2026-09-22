import { getAccessToken } from './authService';
const API=process.env.EXPO_PUBLIC_API_URL??'http://localhost:3000';
export type MlRun={id:string;model:'logistic'|'centroid';status:'completed';samples:number;features:number;trainSamples:number;testSamples:number;accuracy:number;precision:number;recall:number;f1:number;createdAt:string};
async function headers(){const token=await getAccessToken();return{'Content-Type':'application/json',Authorization:`Bearer ${token}`}}
export async function runMlPipeline(model:'logistic'|'centroid',size=240){const r=await fetch(`${API}/ml/run`,{method:'POST',headers:await headers(),body:JSON.stringify({model,size,seed:42})});if(!r.ok)throw new Error('ml_run_failed');return r.json() as Promise<MlRun>}
export async function listMlRuns(){const r=await fetch(`${API}/ml/runs`,{headers:await headers()});if(!r.ok)throw new Error('ml_runs_failed');return r.json() as Promise<MlRun[]>}