import { TAX_TABLE_ROWS, TAX_AT_10M } from './taxTable.js';

// 2026년 10월 기준 근로자 부담분. 출처는 /salary/ 페이지 하단에 표시한다.
export const RATES = {
  basis: '2026-07-01',
  pension: 0.0475,
  pensionBaseMin: 410_000,
  pensionBaseMax: 6_590_000,
  health: 0.03595,
  healthMaxPremium: 4_591_740,
  longTermCareOfHealth: 0.1314,
  employment: 0.009,
  localIncomeTax: 0.1,
};

// 부동소수점 오차(예: 25199.999…)로 한 단계 아래로 절사되는 것을 막는다.
const floor10 = (n) => Math.floor((n + 1e-6) / 10) * 10;

// 10,000천원 초과 구간 (간이세액표 하단 산식)
const OVER_10M = [
  [14_000_000, 10_000_000, 25_000, 0.35, 0.98],
  [28_000_000, 14_000_000, 1_397_000, 0.38, 0.98],
  [30_000_000, 28_000_000, 6_610_600, 0.4, 0.98],
  [45_000_000, 30_000_000, 7_394_600, 0.4, 1],
  [87_000_000, 45_000_000, 13_394_600, 0.42, 1],
  [Infinity, 87_000_000, 31_034_600, 0.45, 1],
];

function tableTax(monthly, family) {
  if (monthly >= 10_000_000) {
    const base = TAX_AT_10M[family - 1];
    if (monthly === 10_000_000) return base;
    const [, from, add, rate, ratio] = OVER_10M.find(([upTo]) => monthly <= upTo);
    return floor10(base + add + (monthly - from) * ratio * rate);
  }
  const thousand = monthly / 1000;
  const row = TAX_TABLE_ROWS.find(([lo, hi]) => thousand >= lo && thousand < hi);
  return row ? row[1 + family] : 0;
}

/** 간이세액표에 따른 월 근로소득세(원). family는 본인 포함 공제대상가족 수. */
export function monthlyIncomeTax(monthlyTaxable, family = 1, children = 0) {
  const fam = Math.max(1, Math.floor(family));
  let tax;
  if (fam <= 11) {
    tax = tableTax(monthlyTaxable, fam);
  } else {
    const t11 = tableTax(monthlyTaxable, 11);
    const t10 = tableTax(monthlyTaxable, 10);
    tax = t11 - (t10 - t11) * (fam - 11);
  }
  const kids = Math.max(0, Math.floor(children));
  const childCredit = kids === 0 ? 0 : kids === 1 ? 20_830 : 45_830 + (kids - 2) * 33_330;
  return Math.max(0, tax - childCredit);
}

/**
 * 연봉 → 월 실수령액.
 * @param {{annual:number, nonTaxable?:number, family?:number, children?:number, withholdingRate?:number}} input
 *   nonTaxable: 월 비과세액(식대 등), withholdingRate: 원천징수 선택비율(0.8 | 1 | 1.2)
 */
export function calcSalary({ annual, nonTaxable = 200_000, family = 1, children = 0, withholdingRate = 1 }) {
  const gross = Math.floor(annual / 12);
  const taxable = Math.max(0, gross - Math.min(nonTaxable, gross));
  const pensionBase = Math.floor(Math.min(Math.max(taxable, RATES.pensionBaseMin), RATES.pensionBaseMax) / 1000) * 1000;
  const pension = taxable === 0 ? 0 : floor10(pensionBase * RATES.pension);
  const health = Math.min(floor10(taxable * RATES.health), RATES.healthMaxPremium);
  const longTermCare = floor10(health * RATES.longTermCareOfHealth);
  const employment = floor10(taxable * RATES.employment);
  const incomeTax = floor10(monthlyIncomeTax(taxable, family, children) * withholdingRate);
  const localIncomeTax = floor10(incomeTax * RATES.localIncomeTax);
  const deductions = pension + health + longTermCare + employment + incomeTax + localIncomeTax;
  const net = gross - deductions;
  return { gross, taxable, pension, health, longTermCare, employment, incomeTax, localIncomeTax, deductions, net, annualNet: net * 12 };
}
