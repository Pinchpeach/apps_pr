export const INTEREST_TAX = { normal: 0.154, preferential: 0.095, free: 0 };

// 부동소수점 오차(예: 25199.999…)로 한 단계 아래로 절사되는 것을 막는다.
const floor10 = (n) => Math.floor((n + 1e-6) / 10) * 10;

/**
 * 예금(목돈 거치) 또는 적금(매월 납입) 만기 금액.
 * @param {{kind:'deposit'|'installment', amount:number, annualRate:number, months:number, compound?:boolean, tax?:keyof INTEREST_TAX}} input
 *   amount: 예금은 원금, 적금은 월 납입액. compound: 월복리 여부.
 */
export function calcSavings({ kind, amount, annualRate, months, compound = false, tax = 'normal' }) {
  const r = annualRate / 12;
  let principal;
  let interest;
  if (kind === 'deposit') {
    principal = amount;
    interest = compound ? amount * ((1 + r) ** months - 1) : amount * r * months;
  } else {
    principal = amount * months;
    // k번째 납입분은 (months - k + 1)개월 동안 이자가 붙는다.
    interest = 0;
    for (let held = 1; held <= months; held++) {
      interest += compound ? amount * ((1 + r) ** held - 1) : amount * r * held;
    }
  }
  interest = Math.floor(interest + 1e-6);
  const taxAmount = floor10(interest * INTEREST_TAX[tax]);
  const afterTaxInterest = interest - taxAmount;
  return { principal, interest, tax: taxAmount, afterTaxInterest, maturity: principal + afterTaxInterest };
}
