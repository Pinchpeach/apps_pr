import { calcIncomeTaxRefund, INDUSTRY_PRESETS } from '../calc/freelancer.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

const METHOD = { simple: '단순경비율', standard: '기준경비율 (간편장부대상자, 2.8배 상한)', standardDouble: '기준경비율 (복식부기의무자, 3.4배 상한)' };
const form = $('#calc');

// 업종을 고르면 참고 경비율을 채운다. 직접 수정하면 '직접 입력'으로 바뀐다.
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
  const r = calcIncomeTaxRefund({
    revenue: readNumber(f.revenue),
    priorRevenue: readNumber(f.priorRevenue),
    rates: { simple: readNumber(f.simple) / 100, simpleOver: readNumber(f.simpleOver) / 100, standard: readNumber(f.standard) / 100 },
    majorExpenses: readNumber(f.majorExpenses),
    dependents: readNumber(f.dependents) || 1,
    children: readNumber(f.children),
    pensionPaid: readNumber(f.pensionPaid),
    otherDeductions: readNumber(f.otherDeductions),
  });
  $('#majorExpenses-field').hidden = r.method === 'simple';
  const refund = r.refund >= 0;
  $('#headline').textContent = `${refund ? '+' : '-'}${won(Math.abs(r.refund))}`;
  $('#headline').classList.toggle('negative', !refund);
  $('#subline').textContent = refund ? '5월 신고 시 돌려받을 예상 금액' : '5월 신고 시 추가로 낼 예상 금액';
  renderRows($('#result'), [
    ['적용 방식', METHOD[r.method]],
    ['사업소득금액', won(r.income)],
    ['소득공제 합계', `-${won(r.deductions)}`],
    ['과세표준', won(r.taxBase)],
    ['산출세액', won(r.computed)],
    ['세액공제', `-${won(r.credits)}`],
    ['낼 세금 (지방세 포함)', won(r.determined + r.local), 'sum'],
    ['이미 떼인 3.3%', won(r.prepaid + r.prepaidLocal)],
    [refund ? '예상 환급액' : '예상 추가 납부액', won(Math.abs(r.refund)), refund ? 'total' : 'total warn'],
  ]);
});
