import { calcAcquisitionTax } from '../calc/acquisition.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

const pct = (r) => `${Number((r * 100).toFixed(2))}%`;

bindCalculator($('#calc'), (form) => {
  const houses = Number(form.houses.value);
  const r = calcAcquisitionTax({
    price: readNumber(form.price),
    houses,
    regulated: form.regulated.checked,
    over85: form.over85.checked,
    firstHome: form.firstHome.checked,
  });
  $('#headline').textContent = won(r.total);
  $('#subline').textContent = `취득세율 ${pct(r.rate)}${r.surcharge ? ' (다주택 중과)' : ''} · 실효세율 ${pct(r.effectiveRate)}`;
  const rows = [
    ['취득세', won(r.acquisition)],
    ['지방교육세', won(r.education)],
    ['농어촌특별세', won(r.rural)],
  ];
  if (form.firstHome.checked) {
    rows.push(['생애최초 감면', r.relief ? `-${won(r.relief)}` : houses > 1 ? '1주택만 해당' : '12억원 초과로 미해당', r.relief ? '' : 'warn']);
  }
  rows.push(['납부할 세금 합계', won(r.total), 'total']);
  renderRows($('#result'), rows);
});
