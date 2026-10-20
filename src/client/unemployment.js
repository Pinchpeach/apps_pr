import { calcUnemployment } from '../calc/unemployment.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

bindCalculator($('#calc'), (form) => {
  const r = calcUnemployment({
    wages3m: readNumber(form.wages3m),
    insuredYears: readNumber(form.insuredYears),
    dailyHours: readNumber(form.dailyHours) || 8,
    over50: form.over50.checked,
  });
  $('#headline').textContent = won(r.total);
  $('#subline').textContent = `1일 ${won(r.daily)} × ${r.days}일${r.capped === 'min' ? ' (하한액 적용)' : r.capped === 'max' ? ' (상한액 적용)' : ''}`;
  renderRows($('#result'), [
    ['1일 평균임금', won(r.averageDailyWage)],
    ['1일 구직급여', won(r.daily)],
    ['소정급여일수', `${r.days}일`],
    ['월 환산 (30일)', won(r.monthly)],
    ['예상 총 수급액', won(r.total), 'total'],
  ]);
});
