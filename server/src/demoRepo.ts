export type DemoTask={id:string;userId:string;title:string;done:boolean;createdAt:string};
const tasks:DemoTask[]=[];
export function listDemoTasks(userId:string){return tasks.filter(x=>x.userId===userId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}
export function createDemoTask(userId:string,title:string){const task={id:crypto.randomUUID(),userId,title,done:false,createdAt:new Date().toISOString()};tasks.push(task);return task}
export function updateDemoTask(userId:string,id:string,done:boolean){const task=tasks.find(x=>x.userId===userId&&x.id===id);if(!task)return null;task.done=done;return task}
export function deleteDemoTask(userId:string,id:string){const i=tasks.findIndex(x=>x.userId===userId&&x.id===id);if(i<0)return false;tasks.splice(i,1);return true}
