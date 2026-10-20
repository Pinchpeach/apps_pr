import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeYear, monthlyTotals, recordedYears, sortEntries } from '../src/calc/ledger.js';

const entries = [
  { id: 'a', date: '2026-01-15', payer: 'A사', gross: 1_000_000, kind: 'business' },
  { id: 'b', date: '2026-03-02', payer: 'B사', gross: 2_000_000, kind: 'business' },
  { id: 'c', date: '2026-03-20', payer: '강연', gross: 500_000, kind: 'other' },
  { id: 'd', date: '2025-12-30', payer: 'A사', gross: 3_000_000, kind: 'business' },
];

test('연도별 합계와 원천징수 세액', () => {
  const s = summarizeYear(entries, 2026);
  assert.equal(s.count, 3);
  assert.equal(s.business, 3_000_000);
  assert.equal(s.other, 500_000);
  // 3.3%: 30,000+3,000 / 60,000+6,000, 8.8%: 40,000+4,000
  assert.equal(s.withheldIncomeTax, 30_000 + 60_000 + 40_000);
  assert.equal(s.withheldLocalTax, 3_000 + 6_000 + 4_000);
  assert.equal(s.net, 967_000 + 1_934_000 + 456_000);
  assert.equal(summarizeYear(entries, 2024).count, 0);
});

test('월별 합계·연도 목록·정렬', () => {
  const m = monthlyTotals(entries, 2026);
  assert.equal(m[0], 1_000_000);
  assert.equal(m[2], 2_500_000);
  assert.equal(m.reduce((a, b) => a + b, 0), 3_500_000);
  assert.deepEqual(recordedYears(entries), [2026, 2025]);
  assert.deepEqual(sortEntries(entries).map((e) => e.id), ['c', 'b', 'a', 'd']);
});

test('지급처별 합계', async () => {
  const { totalsByPayer } = await import('../src/calc/ledger.js');
  assert.deepEqual(totalsByPayer(entries, 2026), [
    { payer: 'B사', gross: 2_000_000, count: 1 },
    { payer: 'A사', gross: 1_000_000, count: 1 },
    { payer: '강연', gross: 500_000, count: 1 },
  ]);
});

test('CSV 내보내기', async () => {
  const { toCsv } = await import('../src/calc/ledger.js');
  const csv = toCsv([...entries, { id: 'e', date: '2026-05-01', payer: '쉼표, "따옴표"', gross: 100_000, kind: 'business' }]);
  assert.ok(csv.startsWith('﻿날짜,지급처,구분,세전 지급액,소득세,지방소득세,실수령액\n'));
  const lines = csv.trim().split('\n');
  assert.equal(lines.length, 6);
  assert.equal(lines[1], '2025-12-30,A사,사업소득 3.3%,3000000,90000,9000,2901000'); // 오래된 순
  assert.ok(lines.includes('2026-05-01,"쉼표, ""따옴표""",사업소득 3.3%,100000,3000,300,96700'));
  assert.ok(lines.includes('2026-03-20,강연,기타소득 8.8%,500000,40000,4000,456000'));
});
