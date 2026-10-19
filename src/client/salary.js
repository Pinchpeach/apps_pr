import { calcSalary } from '../calc/salary.js';
import { $, bindCalculator, readNumber, renderRows, won, koreanAmount } from './common.js';

bindCalculator($('#calc'), (form) => {
  const r = calcSalary({
    annual: readNumber(form.annual),
    nonTaxable: readNumber(form.nonTaxable),
    family: readNumber(form.family) || 1,
    children: readNumber(form.children),
    withholdingRate: Number(form.withholdingRate.value),
  });
  $('#headline').textContent = won(r.net);
  $('#subline').textContent = `연 ${koreanAmount(r.annualNet)} · 공제 합계 월 ${won(r.deductions)}`;
  renderRows($('#result'), [
    ['월 급여(세전)', won(r.gross)],
    ['국민연금 (4.75%)', won(r.pension)],
    ['건강보험 (3.595%)', won(r.health)],
    ['장기요양 (건보료의 13.14%)', won(r.longTermCare)],
    ['고용보험 (0.9%)', won(r.employment)],
    ['근로소득세 (간이세액표)', won(r.incomeTax)],
    ['지방소득세 (10%)', won(r.localIncomeTax)],
    ['공제 합계', won(r.deductions), 'sum'],
    ['월 실수령액', won(r.net), 'total'],
  ]);
});
