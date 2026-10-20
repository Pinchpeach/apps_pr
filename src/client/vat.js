import { vatFromSupply, vatFromTotal } from '../calc/vat.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

bindCalculator($('#calc'), (form) => {
  const amount = readNumber(form.amount);
  const fromSupply = form.mode.value === 'supply';
  const r = fromSupply ? vatFromSupply(amount) : vatFromTotal(amount);
  $('#headline').textContent = won(fromSupply ? r.total : r.supply);
  $('#subline').textContent = fromSupply ? '부가세 포함 합계금액' : '공급가액 (부가세 제외)';
  renderRows($('#result'), [
    ['공급가액', won(r.supply)],
    ['부가세 (10%)', won(r.vat)],
    ['합계금액', won(r.total), 'total'],
  ]);
});
