import { db } from './db.js';
import { Article } from './types.js';
export function articleRow(x: any): Article {
  return { id: x.id, title: x.title, category: x.category, summary: x.summary, source: x.source, publishedAt: new Date(x.published_at).toISOString(), url: x.url ?? undefined, content: x.content ?? undefined, briefing: x.briefing ?? undefined };
}
export async function listArticles(opts: { q?: string; category?: string; since?: Date; notionOnly?: boolean } = {}) {
  const where: string[] = [], values: any[] = [];
  if (opts.q) { values.push('%' + opts.q + '%'); where.push(`(title ILIKE $${values.length} OR summary ILIKE $${values.length} OR content ILIKE $${values.length})`); }
  if (opts.category) { values.push(opts.category); where.push(`(category=$${values.length} OR (briefing->'regions') ? $${values.length} OR (briefing->'sectors') ? $${values.length})`); }
  if (opts.since) { values.push(opts.since); where.push(`published_at >= $${values.length}`); }
  if (opts.notionOnly) where.push('briefing IS NOT NULL');
  const r = await db.query(`SELECT * FROM articles ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY published_at DESC, id LIMIT 200`, values);
  return r.rows.map(articleRow);
}
export async function findArticle(id: string) {
  const r = await db.query('SELECT * FROM articles WHERE id=$1', [id]);
  return r.rows[0] ? articleRow(r.rows[0]) : null;
}
export async function upsertArticles(items: Article[], onlyMissing = false) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const x of items) await client.query(`INSERT INTO articles(id,title,category,summary,source,published_at,url,content,briefing) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(id) ${onlyMissing ? 'DO NOTHING' : 'DO UPDATE SET title=excluded.title,category=excluded.category,summary=excluded.summary,source=excluded.source,published_at=excluded.published_at,url=excluded.url,content=excluded.content,briefing=excluded.briefing,updated_at=now()'}`, [x.id,x.title,x.category,x.summary,x.source,x.publishedAt,x.url ?? null,x.content ?? null,x.briefing ? JSON.stringify(x.briefing) : null]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}
