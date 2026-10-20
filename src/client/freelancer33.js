import { withholding33, grossFromNet } from '../calc/freelancer.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

bindCalculator($('#calc'), (form) => {
  const toNet = form.mode.value === 'net';
  $('#amount-label').textContent = toNet ? '세전 금액 (계약 금액)' : '받고 싶은 실수령액';
  const amount = readNumber(form.amount);
  const r = toNet ? withholding33(amount) : grossFromNet(amount);
  $('#headline').textContent = won(toNet ? r.net : r.gross);
  $('#subline').textContent = toNet ? '통장에 들어오는 금액' : '견적·계약서에 적을 세전 금액';
  renderRows($('#result'), [
    ['세전 금액', won(r.gross)],
    ['소득세 3%', `-${won(r.incomeTax)}`],
    ['지방소득세 0.3%', `-${won(r.localTax)}`],
    ['실수령액', won(r.net), 'total'],
  ]);
});
