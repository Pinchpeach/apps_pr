import { calcNjobTax, INDUSTRY_PRESETS } from '../calc/freelancer.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

const form = $('#calc');
form.industry.addEventListener('change', () => {
  const preset = INDUSTRY_PRESETS.find((p) => p.code === form.industry.value);
  if (!preset) return;
  form.simple.value = Number((preset.simple * 100).toFixed(1));
  form.simpleOver.value = Number((preset.simpleOver * 100).toFixed(1));
  form.standard.value = Number((preset.standard * 100).toFixed(1));
});
for (const name of ['simple', 'simpleOver', 'standard']) {
  form[name].addEventListener('input', () => (form.industry.value = 'custom'));
}

bindCalculator(form, (f) => {
  const r = calcNjobTax({
    totalWage: readNumber(f.totalWage),
    wageTaxBase: readNumber(f.wageTaxBase),
    wageDetermined: readNumber(f.wageDetermined),
    revenue: readNumber(f.revenue),
    priorRevenue: readNumber(f.priorRevenue),
    rates: { simple: readNumber(f.simple) / 100, simpleOver: readNumber(f.simpleOver) / 100, standard: readNumber(f.standard) / 100 },
    majorExpenses: readNumber(f.majorExpenses),
  });
  $('#majorExpenses-field').hidden = r.method === 'simple';
  const refund = r.refund >= 0;
  $('#headline').textContent = `${refund ? '+' : '-'}${won(Math.abs(r.refund))}`;
  $('#headline').classList.toggle('negative', !refund);
  $('#subline').textContent = refund ? '5월 신고 시 돌려받을 예상 금액' : '5월 신고 시 추가로 낼 예상 금액';
  renderRows($('#result'), [
    ['부업 사업소득금액', won(r.businessIncome)],
    ['합산 과세표준', won(r.taxBase)],
    ['부업 때문에 늘어난 세금', won(r.extraTax), 'sum'],
    ['부업에서 떼인 3.3%', won(r.prepaid + r.prepaidLocal - readNumber(f.wageDetermined) - Math.floor((readNumber(f.wageDetermined) * 0.1) / 10) * 10)],
    [refund ? '예상 환급액' : '예상 추가 납부액', won(Math.abs(r.refund)), refund ? 'total' : 'total warn'],
  ]);
});
