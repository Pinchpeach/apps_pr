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
