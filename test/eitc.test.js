import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcEitc, eitcSchedule } from '../src/calc/eitc.js';

test('산정식 (법 제100조의5 표)', () => {
  assert.equal(eitcSchedule('single', 2_000_000).amount, Math.floor((2_000_000 * 165) / 400));
  assert.equal(eitcSchedule('single', 6_000_000).amount, 1_650_000);
  assert.equal(eitcSchedule('single', 15_500_000).amount, Math.floor(1_650_000 - (6_500_000 * 165) / 1300));
  assert.equal(eitcSchedule('single', 22_000_000).amount, 0);
  assert.equal(eitcSchedule('oneEarner', 10_000_000).amount, 2_850_000);
  assert.equal(eitcSchedule('oneEarner', 23_000_000).amount, Math.floor(2_850_000 - (9_000_000 * 285) / 1800));
  assert.equal(eitcSchedule('twoEarner', 4_000_000).amount, Math.floor((4_000_000 * 330) / 800));
  assert.equal(eitcSchedule('twoEarner', 30_500_000).amount, Math.floor(3_300_000 - (13_500_000 * 330) / 2700));
});

test('3.3% 프리랜서 단독가구: 수입 × 조정률 90%', () => {
  const r = calcEitc({ type: 'single', businessRevenue: 10_000_000 });
  assert.equal(r.earnings, 9_000_000);
  assert.equal(r.band, 'taper');
  assert.equal(r.amount, 1_650_000);
  const flat = calcEitc({ type: 'single', businessRevenue: 8_000_000 });
  assert.equal(flat.amount, 1_650_000);
});

test('재산 감액·기한 후 신청·최소 지급액', () => {
  assert.equal(calcEitc({ type: 'single', businessRevenue: 8_000_000, property: 180_000_000 }).amount, 825_000);
  assert.equal(calcEitc({ type: 'single', businessRevenue: 8_000_000, late: true }).amount, Math.floor(1_650_000 * 0.95));
  // 증가구간 소액 → 10만원
  assert.equal(calcEitc({ type: 'single', wage: 100_000 }).amount, 100_000);
  // 증가구간 1만5천원 미만 → 0
  assert.equal(calcEitc({ type: 'single', wage: 30_000 }).amount, 0);
  // 감소구간 끝자락: 산정액 1만5천원~3만원 → 3만원, 1만5천원 미만 → 0
  const edge = calcEitc({ type: 'single', wage: 21_840_000 });
  assert.equal(edge.base, Math.floor(1_650_000 - (12_840_000 * 165) / 1300));
  assert.ok(edge.base >= 15_000 && edge.base < 30_000);
  assert.equal(edge.amount, 30_000);
  assert.equal(calcEitc({ type: 'single', wage: 21_900_000 }).amount, 0);
});

test('자격 요건', () => {
  assert.equal(calcEitc({ type: 'single', businessRevenue: 30_000_000 }).eligible, false); // 2,700만 ≥ 2,200만
  assert.equal(calcEitc({ type: 'single', wage: 10_000_000, property: 240_000_000 }).eligible, false);
  assert.equal(calcEitc({ type: 'single', wage: 10_000_000, otherIncome: 13_000_000 }).eligible, false);
  const two = calcEitc({ type: 'twoEarner', wage: 15_000_000, spouseEarnings: 2_000_000 });
  assert.equal(two.eligible, false);
  const ok = calcEitc({ type: 'twoEarner', wage: 15_000_000, spouseEarnings: 5_000_000 });
  assert.equal(ok.earnings, 20_000_000);
  assert.equal(ok.amount, Math.floor(3_300_000 - (3_000_000 * 330) / 2700));
});
