/** 부가가치세 10%: 공급가액 ↔ 합계금액 */
export function vatFromSupply(supply, rate = 0.1) {
  const vat = Math.floor(supply * rate);
  return { supply, vat, total: supply + vat };
}

/** 합계금액에서 공급가액·세액 역산 (세액 원 미만 절사) */
export function vatFromTotal(total, rate = 0.1) {
  const supply = Math.ceil(total / (1 + rate) - 1e-6);
  return { supply, vat: total - supply, total };
}
