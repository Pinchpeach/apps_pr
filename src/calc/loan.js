/**
 * 대출 상환 스케줄. 내부는 소수까지 계산하고 표시값만 원 단위로 반올림해 마지막 회차에 오차가 몰리지 않게 한다.
 * @param {{principal:number, annualRate:number, months:number, method:'equalPayment'|'equalPrincipal'|'bullet', graceMonths?:number}} input
 *   annualRate: 연 이율(예: 0.045), graceMonths: 거치기간(이자만 납부)
 */
export function calcLoan({ principal, annualRate, months, method, graceMonths = 0 }) {
  const r = annualRate / 12;
  const grace = method === 'bullet' ? 0 : Math.min(Math.max(0, Math.floor(graceMonths)), months - 1);
  const repayMonths = months - grace;
  const fixedPayment = r === 0 ? principal / repayMonths : (principal * r) / (1 - (1 + r) ** -repayMonths);
  const schedule = [];
  let balance = principal;
  for (let i = 1; i <= months; i++) {
    const interest = balance * r;
    let principalPaid = 0;
    if (i > grace) {
      if (i === months) principalPaid = balance;
      else if (method === 'equalPayment') principalPaid = fixedPayment - interest;
      else if (method === 'equalPrincipal') principalPaid = principal / repayMonths;
    }
    balance = Math.max(0, balance - principalPaid);
    schedule.push({
      month: i,
      payment: Math.round(principalPaid + interest),
      principal: Math.round(principalPaid),
      interest: Math.round(interest),
      balance: Math.round(balance),
    });
  }
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  return {
    schedule,
    firstPayment: schedule[grace]?.payment ?? 0,
    maxPayment: Math.max(...schedule.map((row) => row.payment)),
    totalInterest,
    totalPayment: principal + totalInterest,
  };
}
