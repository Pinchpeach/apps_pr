import { listArticles } from '../articleRepo.js';
import { Article, Report } from '../types.js';
import { archiveReport } from './archiveReport.js';
export { archiveReport } from './archiveReport.js';
export async function makeReport(period: Report['period']): Promise<Report> {
  const archive = await listArticles({ notionOnly: true });
  if (archive.length) return archiveReport(period, archive);
  const span = period === 'daily' ? 86400000 : period === 'weekly' ? 604800000 : 2592000000;
  const items = await listArticles({ since: new Date(Date.now()-span) });
  const counts = new Map<string,number>();
  items.forEach(x => counts.set(x.category,(counts.get(x.category) ?? 0)+1));
  const categories = [...counts].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  return { period, generatedAt:new Date().toISOString(), summary:items.length ? `${categories[0]?.name ?? '시장'} 관련 이슈를 중심으로 ${items.length}건의 주요 경제 뉴스를 정리했습니다.` : '해당 기간에 수집된 뉴스가 없습니다.', categories, highlights:items.slice(0,5) };
}
