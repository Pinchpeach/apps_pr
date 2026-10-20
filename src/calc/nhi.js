// 지역가입자 건강보험료 추정. 2026-10 기준.
// 근거: 국민건강보험법 시행령 제44조(보험료율 7.19%, 재산 점수당 211.5원), [별표 4](재산 등급별 점수),
//       시행규칙 제44조(소득 반영 비율·소득월액 하한), [별표 8](보증금·월세 평가),
//       「월별 건강보험료액의 상한과 하한에 관한 고시」 제2025-222호(2026.1.1 시행, 2차 자료로 확인)
import { PROPERTY_GRADES } from './nhiPropertyTable.js';

export const NHI = {
  rate: 0.0719,
  pointValue: 211.5,
  longTermCareOfHealth: 0.1314,
  propertyDeduction: 100_000_000,
  minIncomeMonthly: 280_000,
  minPremium: 20_160,
  maxPremium: 4_591_740,
};

const floor10 = (n) => Math.floor((n + 1e-6) / 10) * 10;

/** 무주택 세대의 전월세 평가액: (보증금 + 월세 × 40) × 30% */
export const leaseValue = (deposit, monthlyRent) => Math.floor((deposit + monthlyRent * 40) * 0.3);

/** 재산 금액(원) → 재산보험료 부과점수. 1억원 공제 후 등급표 적용. */
export function propertyPoints(propertyTotal) {
  const manwon = (propertyTotal - NHI.propertyDeduction) / 10_000;
  if (manwon <= 0) return 0;
  const grade = PROPERTY_GRADES.find(([upper]) => upper === null || manwon <= upper);
  return Number(grade[1]);
}

/**
 * @param {{business?:number, other?:number, wage?:number, pension?:number, interestDividend?:number,
 *          propertyBase?:number, leaseDeposit?:number, leaseMonthly?:number}} input
 *   business·other: 사업·기타소득금액(경비 뺀 금액), wage: 총급여, pension: 공적연금 등 연금소득,
 *   interestDividend: 이자+배당(1,000만원 이하면 제외), propertyBase: 재산세 과세표준 합계
 */
export function calcRegionalPremium({
  business = 0,
  other = 0,
  wage = 0,
  pension = 0,
  interestDividend = 0,
  propertyBase = 0,
  leaseDeposit = 0,
  leaseMonthly = 0,
}) {
  const financial = interestDividend > 10_000_000 ? interestDividend : 0;
  const annualIncome = business + other + financial + (wage + pension) * 0.5;
  const incomeMonthly = Math.floor(annualIncome / 12);
  const incomePremium = incomeMonthly <= NHI.minIncomeMonthly ? NHI.minPremium : floor10(incomeMonthly * NHI.rate);

  const lease = leaseValue(leaseDeposit, leaseMonthly);
  const points = propertyPoints(propertyBase + lease);
  const propertyPremium = floor10(points * NHI.pointValue);

  const health = Math.min(incomePremium + propertyPremium, NHI.maxPremium);
  const longTermCare = floor10(health * NHI.longTermCareOfHealth);
  return { annualIncome, incomeMonthly, incomePremium, lease, points, propertyPremium, health, longTermCare, total: health + longTermCare };
}
