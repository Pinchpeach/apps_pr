// 공인중개사법 시행규칙 [별표 1] 주택 중개보수 상한 요율 (2021-10-19 시행)
const SALE = [
  [50_000_000, 0.006, 250_000],
  [200_000_000, 0.005, 800_000],
  [900_000_000, 0.004, null],
  [1_200_000_000, 0.005, null],
  [1_500_000_000, 0.006, null],
  [Infinity, 0.007, null],
];
const LEASE = [
  [50_000_000, 0.005, 200_000],
  [100_000_000, 0.004, 300_000],
  [600_000_000, 0.003, null],
  [1_200_000_000, 0.004, null],
  [1_500_000_000, 0.005, null],
  [Infinity, 0.006, null],
];

/** 월세 거래금액 환산: 보증금 + 월세×100, 그 결과가 5천만원 미만이면 보증금 + 월세×70 */
export function rentTransactionAmount(deposit, monthlyRent) {
  const amount = deposit + monthlyRent * 100;
  return amount < 50_000_000 ? deposit + monthlyRent * 70 : amount;
}

/**
 * @param {{type:'sale'|'jeonse'|'monthly', price?:number, deposit?:number, monthlyRent?:number}} input
 */
export function calcBrokerage({ type, price = 0, deposit = 0, monthlyRent = 0 }) {
  const amount = type === 'sale' ? price : type === 'jeonse' ? deposit : rentTransactionAmount(deposit, monthlyRent);
  const [, rate, cap] = (type === 'sale' ? SALE : LEASE).find(([below]) => amount < below);
  const raw = Math.floor(amount * rate);
  const fee = cap === null ? raw : Math.min(raw, cap);
  return { amount, rate, cap, fee, vat: Math.floor(fee * 0.1) };
}
