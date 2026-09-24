import type { Article, Report } from '../types.js';
export function archiveReport(period: Report['period'], articles: Article[]): Report {
  const matching = articles.filter(x => x.briefing?.period === period).sort((a,b) => b.publishedAt.localeCompare(a.publishedAt));
  const latest = matching[0];
  const counts = new Map<string,number>();
  matching.forEach(x => x.briefing?.sectors.forEach(name => counts.set(name,(counts.get(name) ?? 0)+1)));
  return { period, generatedAt: new Date().toISOString(), source: 'Notion · 경제 브리핑 아카이브', reportDate: latest?.briefing?.date, importedAt: latest?.briefing?.importedAt,
    summary: latest?.summary ?? '아직 해당 유형의 Notion 보고서가 없습니다.', categories: [...counts].map(([name,count])=>({name,count})), highlights: matching };
}
