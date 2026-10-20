import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  progressiveTax,
  withholding33,
  grossFromNet,
  estimatedIncome,
  calcIncomeTaxRefund,
  checkDependent,
  INDUSTRY_PRESETS,
} from '../src/calc/freelancer.js';

const rates = INDUSTRY_PRESETS[0];

test('종합소득세 기본세율', () => {
  assert.equal(progressiveTax(0), 0);
  assert.equal(progressiveTax(14_000_000), 840_000);
  assert.equal(progressiveTax(30_000_000), 3_240_000);
  assert.equal(progressiveTax(50_000_000), 6_240_000);
  assert.equal(progressiveTax(100_000_000), 19_560_000);
});

test('3.3% 원천징수와 역산', () => {
  assert.deepEqual(withholding33(1_000_000), { gross: 1_000_000, incomeTax: 30_000, localTax: 3_000, net: 967_000 });
  assert.equal(withholding33(30_000).incomeTax, 0); // 소액부징수
  assert.equal(withholding33(33_340).incomeTax, 1_000);
  // 10원 절사 때문에 999,980원도 실수령 967,000원 — 가장 작은 세전 금액을 돌려준다.
  const r = grossFromNet(967_000);
  assert.equal(r.net, 967_000);
  assert.equal(r.gross, 999_980);
  assert.ok(grossFromNet(2_000_000).net >= 2_000_000);
  assert.ok(withholding33(grossFromNet(2_000_000).gross - 1).net < 2_000_000);
});

test('단순경비율: 직전 3,600만원 미만', () => {
  const r = estimatedIncome({ revenue: 30_000_000, priorRevenue: 20_000_000, rates });
  assert.equal(r.method, 'simple');
  assert.equal(r.income, Math.floor(30_000_000 * (1 - 0.641)));
  // 4,000만원 초과분은 초과율
  const over = estimatedIncome({ revenue: 50_000_000, priorRevenue: 0, rates });
  assert.equal(over.income, Math.floor(50_000_000 - 40_000_000 * 0.641 - 10_000_000 * 0.497));
});

test('기준경비율: 배율 상한 2.8 / 복식부기 3.4', () => {
  const r = estimatedIncome({ revenue: 50_000_000, priorRevenue: 40_000_000, rates });
  assert.equal(r.method, 'standard');
  const simple = Math.floor(50_000_000 - 40_000_000 * 0.641 - 10_000_000 * 0.497);
  assert.equal(r.cap, Math.floor(simple * 2.8));
  assert.equal(r.income, Math.min(Math.floor(50_000_000 * (1 - 0.209)), r.cap));
  const d = estimatedIncome({ revenue: 100_000_000, priorRevenue: 80_000_000, rates, majorExpenses: 10_000_000 });
  assert.equal(d.method, 'standardDouble');
  assert.equal(d.standardIncome, Math.floor(100_000_000 - 10_000_000 - 100_000_000 * 0.209 / 2));
});

test('종합소득세 환급: 연 2,000만원 프리랜서', () => {
  const r = calcIncomeTaxRefund({ revenue: 20_000_000, rates });
  // 소득금액 7,180,000 − 인적공제 1,500,000 = 5,680,000 × 6% = 340,800 − 표준세액공제 70,000
  assert.equal(r.income, 7_180_000);
  assert.equal(r.taxBase, 5_680_000);
  assert.equal(r.determined, 270_800);
  assert.equal(r.local, 27_080);
  assert.equal(r.prepaid, 600_000);
  assert.equal(r.refund, 600_000 + 60_000 - 270_800 - 27_080);
});

test('결정세액은 10원 미만 절사', () => {
  const r = calcIncomeTaxRefund({ revenue: 20_000_000, rates: INDUSTRY_PRESETS.find((p) => p.code === '940100') });
  assert.equal(r.determined % 10, 0);
  assert.equal(r.refund % 10, 0);
});

test('종합소득세: 추가 납부가 나오는 경우와 자녀공제', () => {
  const r = calcIncomeTaxRefund({ revenue: 60_000_000, priorRevenue: 50_000_000, rates });
  assert.ok(r.refund < 0);
  const k = calcIncomeTaxRefund({ revenue: 20_000_000, rates, children: 1 });
  assert.equal(k.determined, Math.max(0, 340_800 - 250_000 - 70_000));
});

test('건강보험 피부양자 판정', () => {
  assert.equal(checkDependent({ businessIncome: 4_000_000, registered: false }).eligible, true);
  assert.equal(checkDependent({ businessIncome: 4_000_000, registered: false }).headroom, 1_000_000);
  assert.equal(checkDependent({ businessIncome: 6_000_000, registered: false }).eligible, false);
  assert.equal(checkDependent({ businessIncome: 1, registered: true }).eligible, false);
  assert.equal(checkDependent({ businessIncome: 0, registered: false, pensionIncome: 21_000_000 }).eligible, false);
  assert.equal(checkDependent({ businessIncome: 0, registered: false, financialIncome: 9_000_000 }).total, 0);
  assert.equal(checkDependent({ businessIncome: 3_000_000, registered: false, wageIncome: 8_000_000, propertyBase: 600_000_000 }).eligible, false);
});

test('N잡: 근로소득공제·근로소득세액공제', async () => {
  const { earnedIncomeDeduction, earnedIncomeCredit } = await import('../src/calc/freelancer.js');
  assert.equal(earnedIncomeDeduction(50_000_000), 12_250_000);
  assert.equal(earnedIncomeDeduction(200_000_000), 16_750_000);
  assert.equal(earnedIncomeCredit(1_000_000, 30_000_000), 550_000);
  assert.equal(earnedIncomeCredit(3_000_000, 50_000_000), 660_000);
  assert.equal(earnedIncomeCredit(3_000_000, 34_000_000), 732_000);
});

test('N잡: 부업 소득이 없으면 추가 세금 0, 있으면 한계세율만큼 증가', async () => {
  const { calcNjobTax } = await import('../src/calc/freelancer.js');
  const base = { totalWage: 50_000_000, wageTaxBase: 30_000_000, wageDetermined: 1_500_000, rates };
  for (const wage of [base, { ...base, totalWage: 28_000_000, wageTaxBase: 15_000_000, wageDetermined: 200_000 }]) {
    const zero = calcNjobTax({ ...wage, revenue: 0 });
    assert.equal(zero.extraTax, 0);
    assert.equal(zero.refund, 0);
  }
  const r = calcNjobTax({ ...base, revenue: 10_000_000 });
  assert.equal(r.businessIncome, 3_590_000);
  assert.equal(r.extraTax, Math.floor((3_590_000 * 0.15) / 10) * 10 + Math.floor((3_590_000 * 0.15 * 0.1) / 10) * 10);
  assert.equal(r.refund, 300_000 + 30_000 - r.extraTax);
});
