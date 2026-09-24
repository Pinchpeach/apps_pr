import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { snapshotPath, snapshotArticles, parseNotionBody } from '../services/notionSnapshot.js';
import { archiveReport } from '../services/archiveReport.js';

const raw = JSON.parse(await readFile(snapshotPath, 'utf8'));
test('all seven Notion pages retain content, tags, provenance and Korean dates', () => {
  const items = snapshotArticles(raw);
  assert.equal(items.length, 7);
  assert.equal(items.filter(x => x.briefing?.period === 'daily').length, 6);
  assert.equal(items.filter(x => x.briefing?.period === 'weekly').length, 1);
  for (const item of items) {
    assert.ok(item.content && item.content.length > 1000);
    assert.ok(item.briefing?.sectors.length);
    const source = raw.pages.find((p: any) => `notion-${p.id}` === item.id);
    assert.equal(item.briefing?.blocks.filter(b => b.type === 'table').length, (source.content.match(/<table\b/g) ?? []).length);
    assert.equal(new Date(item.publishedAt).toLocaleDateString('sv-SE', {timeZone:'Asia/Seoul'}), item.briefing?.date);
    assert.match(item.briefing!.notionUrl, /^https:\/\/www.notion.so\/[a-f0-9]{32}$/);
  }
});
test('snapshot rejects duplicate IDs, missing dates and unsafe source URLs', () => {
  const duplicate = structuredClone(raw); duplicate.pages.push(duplicate.pages[0]);
  assert.throws(() => snapshotArticles(duplicate), /duplicate/);
  const invalid = structuredClone(raw); invalid.pages[0].properties['date:날짜:start'] = '';
  assert.throws(() => snapshotArticles(invalid), /date/);
  const unsafe = structuredClone(raw); unsafe.pages[0].properties['출처'] = 'javascript:alert(1)';
  assert.throws(() => snapshotArticles(unsafe), /source URL/);
});
test('table cells and headings remain structured, with no HTML execution', () => {
  const result = parseNotionBody('## 제목\n**사실:** 내용\n<table><tr><td>섹터</td><td>수익률</td></tr><tr><td>기술</td><td>+1%</td></tr></table>');
  assert.deepEqual(result, [{type:'heading',text:'제목'},{type:'paragraph',text:'사실: 내용'},{type:'table',rows:[['섹터','수익률'],['기술','+1%']]}]);
});
test('reports use the archive type and original summary, never invent a monthly report', () => {
  const items = snapshotArticles(raw);
  const daily = archiveReport('daily',items), weekly = archiveReport('weekly',items), monthly = archiveReport('monthly',items);
  assert.equal(daily.reportDate,'2026-09-24');
  assert.equal(daily.summary,items[0].summary);
  assert.equal(weekly.highlights.length,1);
  assert.equal(weekly.reportDate,'2026-09-20');
  assert.equal(monthly.highlights.length,0);
  assert.match(monthly.summary,/없습니다/);
});
