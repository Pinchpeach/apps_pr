import { calcSavings } from '../calc/savings.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

bindCalculator($('#calc'), (form) => {
  const kind = form.kind.value;
  $('#amount-label').textContent = kind === 'deposit' ? '예치 금액' : '월 납입액';
  const r = calcSavings({
    kind,
    amount: readNumber(form.amount),
    annualRate: readNumber(form.rate) / 100,
    months: Math.max(1, Math.round(readNumber(form.months))),
    compound: form.compound.checked,
    tax: form.tax.value,
  });
  $('#headline').textContent = won(r.maturity);
  $('#subline').textContent = `세후 이자 ${won(r.afterTaxInterest)}`;
  renderRows($('#result'), [
    ['원금 합계', won(r.principal)],
    ['세전 이자', won(r.interest)],
    ['이자 과세', `-${won(r.tax)}`],
    ['세후 이자', won(r.afterTaxInterest)],
    ['만기 수령액', won(r.maturity), 'total'],
  ]);
});
