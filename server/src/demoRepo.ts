import { db } from './db.js';
export type DemoTask={id:string;title:string;done:boolean;createdAt:string;updatedAt:string};
function row(x:any):DemoTask{return{id:x.id,title:x.title,done:x.done,createdAt:new Date(x.created_at).toISOString(),updatedAt:new Date(x.updated_at).toISOString()}}
export async function listDemoTasks(userId:string){const r=await db.query('SELECT id,title,done,created_at,updated_at FROM demo_tasks WHERE user_id=$1 ORDER BY created_at DESC',[userId]);return r.rows.map(row)}
export async function createDemoTask(userId:string,title:string){const r=await db.query('INSERT INTO demo_tasks(id,user_id,title) VALUES(gen_random_uuid(),$1,$2) RETURNING id,title,done,created_at,updated_at',[userId,title]);return row(r.rows[0])}
export async function updateDemoTask(userId:string,id:string,done:boolean){const r=await db.query('UPDATE demo_tasks SET done=$3,updated_at=now() WHERE user_id=$1 AND id=$2 RETURNING id,title,done,created_at,updated_at',[userId,id,done]);return r.rows[0]?row(r.rows[0]):null}
export async function deleteDemoTask(userId:string,id:string){const r=await db.query('DELETE FROM demo_tasks WHERE user_id=$1 AND id=$2',[userId,id]);return (r.rowCount??0)>0}
