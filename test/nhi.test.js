import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcRegionalPremium, propertyPoints, leaseValue, NHI } from '../src/calc/nhi.js';
import { PROPERTY_GRADES } from '../src/calc/nhiPropertyTable.js';

test('재산 등급표 원문 (별표 4)', () => {
  assert.equal(PROPERTY_GRADES.length, 60);
  assert.deepEqual(PROPERTY_GRADES[0], [450, 22]);
  assert.deepEqual(PROPERTY_GRADES[30], [43_200, 757]); // 31등급
  assert.deepEqual(PROPERTY_GRADES[59], [null, 2341]);
});

test('재산 점수: 1억원 공제 후 등급', () => {
  assert.equal(propertyPoints(100_000_000), 0);
  assert.equal(propertyPoints(100_000_001), 22);
  assert.equal(propertyPoints(104_500_000), 22); // 450만원 이하
  assert.equal(propertyPoints(104_500_001), 44);
  assert.equal(propertyPoints(1e12), 2341);
});

test('전월세 평가액', () => {
  assert.equal(leaseValue(100_000_000, 0), 30_000_000);
  assert.equal(leaseValue(10_000_000, 500_000), 9_000_000);
});

test('소득월액 28만원 이하는 하한 보험료', () => {
  const r = calcRegionalPremium({ business: 3_000_000 });
  assert.equal(r.incomeMonthly, 250_000);
  assert.equal(r.incomePremium, NHI.minPremium);
  assert.equal(r.propertyPremium, 0);
  assert.equal(r.longTermCare, Math.floor((NHI.minPremium * 0.1314) / 10) * 10);
});

test('프리랜서 사업소득금액 2,400만원 + 재산 과표 3억원', () => {
  const r = calcRegionalPremium({ business: 24_000_000, propertyBase: 300_000_000 });
  assert.equal(r.incomeMonthly, 2_000_000);
  assert.equal(r.incomePremium, 143_800);
  // 3억 − 1억 = 2억원 = 20,000만원 → 표에서 해당 등급 점수
  const points = PROPERTY_GRADES.find(([u]) => u === null || 20_000 <= u)[1];
  assert.equal(r.points, points);
  assert.equal(r.propertyPremium, Math.floor((points * 211.5) / 10) * 10);
  assert.equal(r.total, r.health + r.longTermCare);
});

test('근로·연금 50%, 이자·배당 1,000만원 이하 제외, 상한', () => {
  const r = calcRegionalPremium({ wage: 24_000_000, pension: 12_000_000, interestDividend: 9_000_000 });
  assert.equal(r.annualIncome, 18_000_000);
  assert.equal(calcRegionalPremium({ business: 5e10 }).health, NHI.maxPremium);
});
