// 주택임대차보호법 제7조의2: 전환율 상한 = min(연 10%, 기준금리 + 2%)
export const BASE_RATE = { rate: 0.03, since: '2026-08-27' };
export const legalConversionCap = (baseRate = BASE_RATE.rate) => Math.min(0.1, baseRate + 0.02);

/** 전세 → 월세: 월세 = (전세보증금 − 월세보증금) × 전환율 ÷ 12 */
export const jeonseToMonthly = ({ jeonse, deposit, rate }) => Math.round((Math.max(0, jeonse - deposit) * rate) / 12);

/** 월세 → 전세: 전세 = 보증금 + 월세 × 12 ÷ 전환율 */
export const monthlyToJeonse = ({ deposit, monthly, rate }) => (rate > 0 ? Math.round(deposit + (monthly * 12) / rate) : NaN);

/** 실제 전환율 = 월세 × 12 ÷ (전세보증금 − 월세보증금) */
export const impliedRate = ({ jeonse, deposit, monthly }) => (jeonse > deposit ? (monthly * 12) / (jeonse - deposit) : NaN);
