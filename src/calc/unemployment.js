import { MIN_WAGE } from './wage.js';

// 고용보험법 시행령 — 2026.1.1 이후 이직자
export const BENEFIT = { maxDaily: 68_100, minRatio: 0.8, replacement: 0.6 };

/** 소정급여일수 [피보험기간 상한(년), 50세 미만, 50세 이상·장애인] */
const DAYS = [
  [1, 120, 120],
  [3, 150, 180],
  [5, 180, 210],
  [10, 210, 240],
  [Infinity, 240, 270],
];

export function benefitDays(insuredYears, over50) {
  const row = DAYS.find(([below]) => insuredYears < below);
  return over50 ? row[2] : row[1];
}

/**
 * @param {{wages3m:number, periodDays?:number, dailyHours?:number, insuredYears:number, over50?:boolean}} input
 *   wages3m: 이직 전 3개월 임금 총액, periodDays: 그 기간 일수(기본 91), dailyHours: 1일 소정근로시간
 */
export function calcUnemployment({ wages3m, periodDays = 91, dailyHours = 8, insuredYears, over50 = false }) {
  const averageDailyWage = wages3m / periodDays;
  const minDaily = Math.floor(MIN_WAGE.hourly * BENEFIT.minRatio * Math.min(dailyHours, 8));
  const raw = Math.floor(averageDailyWage * BENEFIT.replacement);
  const daily = Math.min(Math.max(raw, minDaily), BENEFIT.maxDaily);
  const days = benefitDays(insuredYears, over50);
  return {
    averageDailyWage: Math.floor(averageDailyWage),
    daily,
    minDaily,
    capped: raw > BENEFIT.maxDaily ? 'max' : raw < minDaily ? 'min' : null,
    days,
    monthly: daily * 30,
    total: daily * days,
  };
}
