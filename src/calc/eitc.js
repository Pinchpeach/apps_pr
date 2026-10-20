// 근로장려금 (조세특례제한법 제100조의3·제100조의5·제100조의7, 시행령 제100조의3). 2026-10 기준.

/** 가구별 [총소득기준금액, 증가구간 끝, 평탄구간 끝, 최대액] — 법 제100조의3·제100조의5 */
export const HOUSEHOLD = {
  single: { label: '단독가구', limit: 22_000_000, rampEnd: 4_000_000, flatEnd: 9_000_000, max: 1_650_000 },
  oneEarner: { label: '홑벌이 가구', limit: 32_000_000, rampEnd: 7_000_000, flatEnd: 14_000_000, max: 2_850_000 },
  twoEarner: { label: '맞벌이 가구', limit: 44_000_000, rampEnd: 8_000_000, flatEnd: 17_000_000, max: 3_300_000 },
};

/** 사업소득 조정률(시행령 제100조의3) 중 프리랜서에 해당하는 값 */
export const ADJUSTMENT = { personalService: 0.9, software: 0.6, education: 0.75, art: 0.7 };

export const PROPERTY_LIMIT = 240_000_000;
export const PROPERTY_HALF = 170_000_000;

/** 총급여액 등 → 산정식 금액(원)과 구간('ramp' | 'flat' | 'taper' | 'none') */
export function eitcSchedule(type, earnings) {
  const h = HOUSEHOLD[type];
  if (earnings <= 0 || earnings >= h.limit) return { amount: 0, band: 'none' };
  if (earnings < h.rampEnd) return { amount: Math.floor((earnings * h.max) / h.rampEnd), band: 'ramp' };
  if (earnings < h.flatEnd) return { amount: h.max, band: 'flat' };
  return { amount: Math.floor(h.max - ((earnings - h.flatEnd) * h.max) / (h.limit - h.flatEnd)), band: 'taper' };
}

/**
 * @param {{type:'single'|'oneEarner'|'twoEarner', wage?:number, businessRevenue?:number, adjustment?:number,
 *          spouseEarnings?:number, otherIncome?:number, property?:number, late?:boolean}} input
 *   businessRevenue: 3.3% 사업 수입(세전), adjustment: 업종 조정률(인적용역 0.9),
 *   spouseEarnings: 배우자의 총급여액 등, otherIncome: 이자·배당·연금·기타소득금액 합계(가구),
 *   property: 가구원 재산 합계(6월 1일 기준), late: 기한 후 신청(6~11월, 95%)
 */
export function calcEitc({ type, wage = 0, businessRevenue = 0, adjustment = ADJUSTMENT.personalService, spouseEarnings = 0, otherIncome = 0, property = 0, late = false }) {
  const h = HOUSEHOLD[type];
  const ownEarnings = Math.floor(wage + businessRevenue * adjustment);
  const earnings = ownEarnings + (type === 'single' ? 0 : spouseEarnings);
  const totalIncome = earnings + otherIncome;
  const reasons = [];
  if (totalIncome >= h.limit) reasons.push(`가구 연간 총소득 ${totalIncome.toLocaleString('ko-KR')}원이 ${h.label} 기준 ${(h.limit / 10_000).toLocaleString('ko-KR')}만원 이상입니다.`);
  if (property >= PROPERTY_LIMIT) reasons.push('가구원 재산 합계가 2억 4천만원 이상입니다.');
  if (earnings <= 0) reasons.push('근로·사업 소득이 없습니다.');
  if (type === 'twoEarner' && spouseEarnings < 3_000_000) reasons.push('배우자 총급여액 등이 300만원 미만이면 맞벌이가 아닌 홑벌이 가구입니다.');
  if (reasons.length) return { eligible: false, reasons, ownEarnings, earnings, totalIncome, base: 0, amount: 0 };

  const { amount: base, band } = eitcSchedule(type, earnings);
  let amount = base;
  if (property >= PROPERTY_HALF) amount = Math.floor(amount / 2);
  if (late) amount = Math.floor(amount * 0.95);
  // 최소 지급액(법 제100조의7③): 1만5천원 미만 0원, 증가구간 10만원 미만은 10만원, 감소구간 3만원 미만은 3만원
  if (amount < 15_000) amount = 0;
  else if (band === 'ramp' && amount < 100_000) amount = 100_000;
  else if (band === 'taper' && amount < 30_000) amount = 30_000;
  return { eligible: amount > 0, reasons: amount > 0 ? [] : ['산정액이 1만 5천원 미만입니다.'], ownEarnings, earnings, totalIncome, base, band, amount };
}
