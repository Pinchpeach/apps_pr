import { calcLoan } from '../calc/loan.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

bindCalculator($('#calc'), (form) => {
  const years = readNumber(form.years);
  const r = calcLoan({
    principal: readNumber(form.principal),
    annualRate: readNumber(form.rate) / 100,
    months: Math.max(1, Math.round(years * 12)),
    method: form.method.value,
    graceMonths: Math.round(readNumber(form.grace) * 12),
  });
  const label = { equalPayment: '매월 상환액', equalPrincipal: '첫 달 상환액', bullet: '매월 이자' }[form.method.value];
  $('#headline').textContent = won(form.method.value === 'bullet' ? r.schedule[0].interest : r.firstPayment);
  $('#subline').textContent = `${label} · 총 이자 ${won(r.totalInterest)}`;
  renderRows($('#result'), [
    ['대출 원금', won(readNumber(form.principal))],
    ['총 이자', won(r.totalInterest)],
    ['총 상환액', won(r.totalPayment), 'total'],
    ['최대 월 납입액', won(r.maxPayment)],
  ]);
  const body = $('#schedule tbody');
  body.replaceChildren(
    ...r.schedule.map((row) => {
      const tr = document.createElement('tr');
      for (const v of [row.month, won(row.payment), won(row.principal), won(row.interest), won(row.balance)]) {
        const td = document.createElement('td');
        td.textContent = v;
        tr.append(td);
      }
      return tr;
    }),
  );
});
