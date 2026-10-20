// 지방세법 제11조·제13조의2 주택 유상취득 (개인). 2026-10 기준.

/** 1~3% 구간 세율. 6억~9억은 (가액 × 2/3억 − 3) / 100, 소수점 다섯째 자리 반올림. */
export function baseHousingRate(price) {
  if (price <= 600_000_000) return 0.01;
  if (price > 900_000_000) return 0.03;
  return Math.round(((price / 100_000_000) * (2 / 3) - 3) / 100 * 10_000) / 10_000;
}

/**
 * 다주택 중과 세율. houses: 이번 취득 후 보유 주택 수.
 * 조정대상지역: 2주택 8%, 3주택 이상 12% / 비조정: 3주택 8%, 4주택 이상 12%
 */
export function surchargeRate(houses, regulated) {
  if (regulated) return houses >= 3 ? 0.12 : houses === 2 ? 0.08 : 0;
  return houses >= 4 ? 0.12 : houses === 3 ? 0.08 : 0;
}

/**
 * @param {{price:number, houses?:number, regulated?:boolean, over85?:boolean, firstHome?:boolean}} input
 *   over85: 전용면적 85㎡ 초과(농어촌특별세 과세), firstHome: 생애최초 감면(12억 이하, 최대 200만원)
 */
export function calcAcquisitionTax({ price, houses = 1, regulated = false, over85 = false, firstHome = false }) {
  const surcharge = surchargeRate(houses, regulated);
  const rate = surcharge || baseHousingRate(price);
  const acquisition = Math.floor(price * rate);
  // 지방교육세: 일반 1~3%는 취득세의 10%, 중과는 0.4%
  const education = Math.floor(price * (surcharge ? 0.004 : rate * 0.1));
  // 농어촌특별세(85㎡ 초과): 일반 0.2%, 8% 중과 0.6%, 12% 중과 1.0%
  const ruralRate = !over85 ? 0 : surcharge === 0.12 ? 0.01 : surcharge === 0.08 ? 0.006 : 0.002;
  const rural = Math.floor(price * ruralRate);
  const firstHomeEligible = firstHome && houses === 1 && price <= 1_200_000_000;
  const relief = firstHomeEligible ? Math.min(acquisition, 2_000_000) : 0;
  const total = acquisition - relief + education + rural;
  return { rate, surcharge: surcharge > 0, acquisition, relief, education, rural, total, effectiveRate: price ? total / price : 0 };
}
