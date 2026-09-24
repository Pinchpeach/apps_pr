import { readFile } from 'node:fs/promises';
import type { Article, BriefingBlock, Category } from '../types.js';

export const snapshotPath = new URL('../../data/notion-briefings.json', import.meta.url);
export function plainText(value: string): string {
  return value.replace(/\\([\[\]~$*_`])/g, '$1').replace(/\*\*(.*?)\*\*/g, '$1');
}
export function parseNotionBody(body: string): BriefingBlock[] {
  const parts = body.split(/(<table\b[^>]*>[\s\S]*?<\/table>)/g);
  return parts.flatMap((part): BriefingBlock[] => {
    if (part.startsWith('<table')) {
      const rows = [...part.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(row =>
        [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(cell => plainText(cell[1].trim())));
      return [{ type: 'table', rows }];
    }
    return part.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
      const heading = line.match(/^#{1,6}\s+(.+)/);
      return { type: heading ? 'heading' : 'paragraph', text: plainText(heading ? heading[1] : line.replace(/^[-*] /, '• ').replace(/^> /, '')) };
    });
  });
}
export function snapshotArticles(raw: unknown): Article[] {
  const snapshot = raw as any;
  if (snapshot?.version !== 1 || !Array.isArray(snapshot.pages) || !Number.isFinite(Date.parse(snapshot.exportedAt))) throw new Error('Invalid Notion snapshot');
  const seen = new Set<string>();
  return snapshot.pages.map((page: any) => {
    const p = page.properties;
    const id = String(page.id ?? '').replace(/-/g, '');
    if (!/^[a-f0-9]{32}$/.test(id) || seen.has(id)) throw new Error('Invalid or duplicate Notion page ID');
    seen.add(id);
    const period = ({ '일간': 'daily', '주간': 'weekly', '월간': 'monthly' } as const)[p?.['유형'] as '일간' | '주간' | '월간'];
    const date = p?.['date:날짜:start'];
    if (!period || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) throw new Error('Invalid briefing type or date');
    for (const field of ['지역', '섹터']) if (!Array.isArray(p[field]) || !p[field].every((x: unknown) => typeof x === 'string')) throw new Error('Invalid briefing tags');
    if (typeof page.title !== 'string' || !page.title.trim() || typeof page.content !== 'string' || !page.content.trim() || typeof p['핵심 요약'] !== 'string') throw new Error('Incomplete briefing');
    let sourceUrl: string | undefined;
    if (p['출처']) {
      const url = new URL(p['출처']);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid source URL');
      sourceUrl = url.href;
    }
    const regions: string[] = p['지역'];
    const category: Category = regions.includes('글로벌') ? '글로벌' : regions.includes('한국') ? '한국' : regions.includes('미국') ? '미국' : '글로벌';
    const blocks = parseNotionBody(page.content);
    return { id: `notion-${id}`, title: page.title, category, summary: plainText(p['핵심 요약']),
      source: 'Notion · 경제 브리핑 아카이브', publishedAt: new Date(`${date}T00:00:00+09:00`).toISOString(), url: sourceUrl,
      content: blocks.map(b => b.type === 'table' ? b.rows.map(row => row.join(' | ')).join('\n') : b.text).join('\n\n'),
      briefing: { period, date, regions, sectors: p['섹터'], notionUrl: `https://www.notion.so/${id}`, importedAt: snapshot.exportedAt, blocks } };
  });
}
export async function readNotionSnapshot(): Promise<Article[]> {
  return snapshotArticles(JSON.parse(await readFile(snapshotPath, 'utf8')));
}
