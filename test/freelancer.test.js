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

test('기타소득 8.8%와 과세최저한', async () => {
  const { otherIncomeWithholding } = await import('../src/calc/freelancer.js');
  assert.deepEqual(otherIncomeWithholding(1_000_000), { gross: 1_000_000, incomeAmount: 400_000, exempt: false, incomeTax: 80_000, localTax: 8_000, net: 912_000 });
  assert.equal(otherIncomeWithholding(125_000).exempt, true);
  assert.equal(otherIncomeWithholding(125_000).net, 125_000);
  assert.equal(otherIncomeWithholding(125_010).exempt, false);
});

test('기타소득 분리과세 vs 종합과세', async () => {
  const { compareOtherIncomeTaxation } = await import('../src/calc/freelancer.js');
  // 다른 소득 없음: 소득금액 200만원 × 6% = 12만원 < 분리과세 40만원 → 종합과세 유리
  const low = compareOtherIncomeTaxation({ annualGross: 5_000_000 });
  assert.equal(low.incomeAmount, 2_000_000);
  assert.equal(low.separate.tax, 400_000);
  assert.equal(low.combined.tax, 120_000);
  assert.equal(low.better, 'combined');
  // 과세표준 1억원 직장인: 35% 구간 → 분리과세 유리
  const high = compareOtherIncomeTaxation({ annualGross: 5_000_000, otherTaxBase: 100_000_000 });
  assert.equal(high.combined.tax, 700_000);
  assert.equal(high.better, 'separate');
  // 소득금액 300만원 초과면 무조건 종합과세
  assert.equal(compareOtherIncomeTaxation({ annualGross: 8_000_000 }).canSeparate, false);
});

test('세금 일정 D-day', async () => {
  const { upcomingEvents } = await import('../src/calc/schedule.js');
  const list = upcomingEvents(new Date(2026, 9, 20)); // 2026-10-20
  const interim = list.find((e) => e.id === 'interim');
  assert.equal(interim.ongoing, false);
  assert.equal(interim.days, 12);
  const income = list.find((e) => e.id === 'income-tax');
  assert.equal(income.start.toISOString().slice(0, 10), '2027-05-01');
  assert.equal(list[0].id, 'interim'); // 가장 가까운 일정이 먼저
  const may = upcomingEvents(new Date(2027, 4, 10)).find((e) => e.id === 'income-tax');
  assert.equal(may.ongoing, true);
  assert.equal(may.days, 21);
});

test('세금 일정 알림 시각', async () => {
  const { reminderTimes } = await import('../src/calc/schedule.js');
  const now = new Date(2026, 9, 20, 12); // 2026-10-20 12:00
  const list = reminderTimes(now);
  const first = list[0];
  assert.equal(first.date.getFullYear(), 2026);
  assert.equal(first.date.getMonth(), 10); // 11월
  assert.equal(first.date.getDate(), 1);
  assert.equal(first.date.getHours(), 9);
  const due = list.find((r) => r.key === 'interim:2026:due');
  assert.equal(due.date.getDate(), 27); // 11/30 마감 3일 전
  assert.ok(list.every((r) => r.date > now));
  assert.equal(new Set(list.map((r) => r.key)).size, list.length);
  // 진행 중인 일정의 이미 지난 시작 알림은 빠진다
  const may = reminderTimes(new Date(2027, 4, 10, 12));
  assert.equal(may.some((r) => r.key === 'income-tax:2027:start'), false);
  assert.equal(may.some((r) => r.key === 'income-tax:2027:due'), true);
  // 리뷰 #3: 신고 기간 중에 켜도 다음 해 알림이 예약된다
  const late = reminderTimes(new Date(2026, 4, 29, 12));
  assert.ok(late.some((r) => r.key === 'income-tax:2027:start'));
  assert.ok(late.some((r) => r.key === 'earned-credit:2027:due'));
});

test('리뷰 수정: 소액부징수 역산·피부양자 재산 여유·절약액 정수', async () => {
  const { grossFromNet, checkDependent, compareOtherIncomeTaxation, calcIncomeTaxRefund } = await import('../src/calc/freelancer.js');
  // #6: 세금이 안 붙는 금액은 그대로
  assert.equal(grossFromNet(32_500).gross, 32_500);
  assert.equal(grossFromNet(33_333).gross, 33_333);
  assert.equal(grossFromNet(33_334).net >= 33_334, true);
  // #4: 재산 5.4억 초과면 소득 1,000만원까지만 여유
  assert.equal(checkDependent({ businessIncome: 3_000_000, registered: false, propertyBase: 600_000_000 }).headroom, 2_000_000);
  // minor: 절약액 정수
  assert.equal(Number.isInteger(compareOtherIncomeTaxation({ annualGross: 7_000_000 }).saving), true);
  // #2: 실제로 떼인 세금이 0이면 환급도 없다(추가 납부 여부만)
  const r = calcIncomeTaxRefund({ revenue: 3_000_000, rates: INDUSTRY_PRESETS[0], withheld: 0 });
  assert.equal(r.prepaid, 0);
  assert.ok(r.refund <= 0);
});
