// 프리랜서(인적용역 사업소득) 세금·건강보험 계산. 2026-10 기준.
// 근거: 소득세법 제55조(세율), 시행령 제143조(추계), 시행규칙 제67조(배율),
//       국민건강보험법 시행규칙 [별표 1의2](피부양자 소득요건)

const floor10 = (n) => Math.floor((n + 1e-6) / 10) * 10;

/** 종합소득세 기본세율 [과세표준 상한, 세율, 누진공제] */
const BRACKETS = [
  [14_000_000, 0.06, 0],
  [50_000_000, 0.15, 1_260_000],
  [88_000_000, 0.24, 5_760_000],
  [150_000_000, 0.35, 15_440_000],
  [300_000_000, 0.38, 19_940_000],
  [500_000_000, 0.4, 25_940_000],
  [1_000_000_000, 0.42, 35_940_000],
  [Infinity, 0.45, 65_940_000],
];

export function progressiveTax(base) {
  if (base <= 0) return 0;
  const [, rate, deduction] = BRACKETS.find(([upTo]) => base <= upTo);
  return Math.floor(base * rate - deduction);
}

/* ───────── 3.3% 원천징수 ───────── */

/** 지급액(세전) → 원천징수 소득세 3%·지방소득세 0.3%. 소득세 1,000원 미만은 소액부징수. */
export function withholding33(gross) {
  const incomeTax = floor10(gross * 0.03);
  const tax = incomeTax < 1_000 ? 0 : incomeTax;
  const local = floor10(tax * 0.1);
  return { gross, incomeTax: tax, localTax: local, net: gross - tax - local };
}

/** 받고 싶은 실수령액 → 필요한 세전 금액 */
export function grossFromNet(net) {
  let gross = Math.ceil(net / 0.967);
  while (withholding33(gross).net < net) gross++;
  while (gross > 0 && withholding33(gross - 1).net >= net) gross--;
  return withholding33(gross);
}

/* ───────── 종합소득세 환급 추정 ───────── */

/** 자주 쓰는 인적용역 업종코드. 경비율은 매년 국세청 고시로 바뀌므로 참고값이며 사용자가 수정할 수 있다. */
export const INDUSTRY_PRESETS = [
  { code: '940909', name: '기타 자영업 (일반 프리랜서)', simple: 0.641, simpleOver: 0.497, standard: 0.209 },
  { code: '940926', name: '소프트웨어 프리랜서', simple: 0.641, simpleOver: 0.497, standard: 0.209 },
  { code: '940306', name: '1인 미디어 콘텐츠 창작자', simple: 0.641, simpleOver: 0.497, standard: 0.168 },
  { code: '940903', name: '학원 강사', simple: 0.617, simpleOver: 0.464, standard: 0.184 },
  { code: '940100', name: '저술가·작가', simple: 0.587, simpleOver: 0.422, standard: 0.155 },
];

export const SIMPLE_RATE_LIMITS = { priorYear: 36_000_000, currentYear: 75_000_000, overThreshold: 40_000_000 };
export const STANDARD_MULTIPLIER = { simpleBook: 2.8, doubleEntry: 3.4 };

/**
 * 장부 없이 추계 신고할 때의 사업소득금액.
 * @param {{revenue:number, priorRevenue:number, rates:{simple:number, simpleOver:number, standard:number}, majorExpenses?:number}} input
 *   majorExpenses: 기준경비율 적용 시 증빙 있는 주요경비(매입·임차료·인건비)
 */
export function estimatedIncome({ revenue, priorRevenue, rates, majorExpenses = 0 }) {
  const { priorYear, currentYear, overThreshold } = SIMPLE_RATE_LIMITS;
  const simpleIncome = (() => {
    const base = Math.min(revenue, overThreshold);
    const over = Math.max(0, revenue - overThreshold);
    return Math.max(0, Math.floor(revenue - base * rates.simple - over * rates.simpleOver));
  })();
  const simpleEligible = priorRevenue < priorYear && revenue < currentYear;
  if (simpleEligible) return { method: 'simple', income: simpleIncome, simpleIncome };
  // 기준경비율: 인적용역은 직전 수입 7,500만원 미만이면 간편장부대상자(배율 2.8), 이상이면 복식부기의무자(3.4, 기준경비율 1/2)
  const doubleEntry = priorRevenue >= currentYear;
  const standardRate = doubleEntry ? rates.standard / 2 : rates.standard;
  const standardIncome = Math.max(0, Math.floor(revenue - Math.min(revenue, majorExpenses + revenue * standardRate)));
  const cap = Math.floor(simpleIncome * (doubleEntry ? STANDARD_MULTIPLIER.doubleEntry : STANDARD_MULTIPLIER.simpleBook));
  return { method: doubleEntry ? 'standardDouble' : 'standard', income: Math.min(standardIncome, cap), simpleIncome, standardIncome, cap };
}

/**
 * 3.3% 떼인 프리랜서의 5월 종합소득세 정산 추정 (사업소득만 있는 경우).
 * @param {{revenue:number, priorRevenue?:number, rates:object, majorExpenses?:number, dependents?:number,
 *          pensionPaid?:number, otherDeductions?:number, children?:number, withheld?:number}} input
 *   dependents: 본인 포함 기본공제 인원, pensionPaid: 납부한 국민연금(지역) 보험료,
 *   otherDeductions: 노란우산공제 등 기타 소득공제, children: 8세 이상 자녀 수,
 *   withheld: 이미 원천징수된 소득세(없으면 수입 × 3%로 추정)
 */
export function calcIncomeTaxRefund({
  revenue,
  priorRevenue = 0,
  rates,
  majorExpenses = 0,
  dependents = 1,
  pensionPaid = 0,
  otherDeductions = 0,
  children = 0,
  withheld,
}) {
  const income = estimatedIncome({ revenue, priorRevenue, rates, majorExpenses });
  const personal = 1_500_000 * Math.max(1, Math.floor(dependents));
  const deductions = personal + pensionPaid + otherDeductions;
  const taxBase = Math.max(0, income.income - deductions);
  const computed = progressiveTax(taxBase);
  // 자녀세액공제(2025 귀속~): 1명 25만, 2명 55만, 3명 이상 55만 + 1명당 40만
  const kids = Math.max(0, Math.floor(children));
  const childCredit = kids === 0 ? 0 : kids === 1 ? 250_000 : 550_000 + (kids - 2) * 400_000;
  // 근로소득이 없는 사업소득자의 표준세액공제 7만원
  const standardCredit = 70_000;
  const determined = floor10(Math.max(0, computed - childCredit - standardCredit));
  const local = floor10(determined * 0.1);
  const prepaid = withheld ?? floor10(revenue * 0.03);
  const prepaidLocal = floor10(prepaid * 0.1);
  const refund = prepaid + prepaidLocal - (determined + local);
  return { ...income, deductions, taxBase, computed, credits: childCredit + standardCredit, determined, local, prepaid, prepaidLocal, refund };
}

/* ───────── 건강보험 피부양자 소득요건 ───────── */

/**
 * @param {{businessIncome:number, registered:boolean, wageIncome?:number, pensionIncome?:number,
 *          financialIncome?:number, otherIncome?:number, propertyBase?:number}} input
 *   businessIncome: 사업소득금액(수입 − 필요경비), registered: 사업자등록 여부,
 *   financialIncome: 이자·배당 합계(1,000만원 이하면 합산 제외), otherIncome: 기타소득금액,
 *   propertyBase: 재산세 과세표준 합계
 */
export function checkDependent({
  businessIncome,
  registered,
  wageIncome = 0,
  pensionIncome = 0,
  financialIncome = 0,
  otherIncome = 0,
  propertyBase = 0,
}) {
  const financial = financialIncome > 10_000_000 ? financialIncome : 0;
  const total = businessIncome + wageIncome + pensionIncome + financial + otherIncome;
  const reasons = [];
  if (total > 20_000_000) reasons.push(`연간 합산소득 ${total.toLocaleString('ko-KR')}원이 2,000만원을 넘습니다.`);
  if (registered && businessIncome > 0) reasons.push('사업자등록이 있고 사업소득이 있습니다.');
  if (!registered && businessIncome > 5_000_000) reasons.push('사업자등록이 없어도 사업소득이 연 500만원을 넘습니다.');
  if (propertyBase > 900_000_000) reasons.push('재산세 과세표준이 9억원을 넘습니다.');
  else if (propertyBase > 540_000_000 && total > 10_000_000) reasons.push('재산세 과세표준 5.4억원 초과이면서 소득이 1,000만원을 넘습니다.');
  const businessLimit = registered ? 0 : 5_000_000;
  const headroom = Math.min(20_000_000 - total, businessLimit - businessIncome);
  return { eligible: reasons.length === 0, total, reasons, headroom: Math.max(0, headroom) };
}
