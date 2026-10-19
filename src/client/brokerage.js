import { calcBrokerage } from '../calc/brokerage.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

bindCalculator($('#calc'), (form) => {
  const type = form.type.value;
  $('#price-field').hidden = type !== 'sale';
  $('#deposit-field').hidden = type === 'sale';
  $('#rent-field').hidden = type !== 'monthly';
  const r = calcBrokerage({
    type,
    price: readNumber(form.price),
    deposit: readNumber(form.deposit),
    monthlyRent: readNumber(form.rent),
  });
  $('#headline').textContent = won(r.fee);
  $('#subline').textContent = `상한 요율 ${(r.rate * 100).toFixed(1)}%${r.cap ? ` · 한도 ${won(r.cap)}` : ''} · 부가세 별도`;
  renderRows($('#result'), [
    ['거래금액', won(r.amount)],
    ['상한 요율', `${(r.rate * 100).toFixed(1)}%`],
    ['한도액', r.cap ? won(r.cap) : '없음'],
    ['중개보수 상한', won(r.fee), 'total'],
    ['부가세 포함 시 (일반과세자 10%)', won(r.fee + r.vat)],
  ]);
});
