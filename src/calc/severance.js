import { addDays, addMonths, daysBetween } from './date.js';

/**
 * 근로자퇴직급여 보장법에 따른 퇴직금 추정.
 * 퇴직금 = 1일 평균임금 × 30일 × (재직일수 / 365)
 * @param {{start:Date, lastWorkDay:Date, wages3m:number, annualBonus?:number, annualLeavePay?:number}} input
 *   wages3m: 퇴직 전 3개월 임금 총액(세전), annualBonus/annualLeavePay: 최근 1년 상여금·연차수당 총액
 */
export function calcSeverance({ start, lastWorkDay, wages3m, annualBonus = 0, annualLeavePay = 0 }) {
  const retireDay = addDays(lastWorkDay, 1);
  const serviceDays = daysBetween(start, retireDay);
  const periodDays = daysBetween(addMonths(retireDay, -3), retireDay);
  const totalWages = wages3m + (annualBonus * 3) / 12 + (annualLeavePay * 3) / 12;
  const averageDailyWage = periodDays > 0 ? totalWages / periodDays : 0;
  const eligible = serviceDays >= 365;
  const severance = eligible ? Math.floor((averageDailyWage * 30 * serviceDays) / 365) : 0;
  return { serviceDays, periodDays, averageDailyWage: Math.floor(averageDailyWage * 100) / 100, eligible, severance };
}
