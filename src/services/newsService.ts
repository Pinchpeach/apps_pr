import { news,NewsItem } from '../data/news';
const API_URL=process.env.EXPO_PUBLIC_API_URL;
export async function getNews():Promise<NewsItem[]>{if(!API_URL)return news;try{const r=await fetch(API_URL+'/news');if(!r.ok)throw new Error('news request failed');return await r.json()}catch{return news}}
export async function getNewsById(id:string){const items=await getNews();return items.find(x=>x.id===id)??items[0]}
