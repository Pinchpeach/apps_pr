import { calcSeverance } from '../calc/severance.js';
import { parseDate } from '../calc/date.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

bindCalculator($('#calc'), (form) => {
  const start = parseDate(form.start.value);
  const lastWorkDay = parseDate(form.end.value);
  if (!start || !lastWorkDay || lastWorkDay < start) {
    $('#headline').textContent = '-';
    $('#subline').textContent = '입사일과 마지막 근무일을 확인해 주세요.';
    $('#result').replaceChildren();
    return;
  }
  const r = calcSeverance({
    start,
    lastWorkDay,
    wages3m: readNumber(form.wages3m),
    annualBonus: readNumber(form.bonus),
    annualLeavePay: readNumber(form.leavePay),
  });
  $('#headline').textContent = r.eligible ? won(r.severance) : '지급 대상 아님';
  $('#subline').textContent = r.eligible
    ? `재직 ${r.serviceDays.toLocaleString('ko-KR')}일 기준 (세전)`
    : `재직 ${r.serviceDays}일 — 1년(365일) 이상 근무해야 퇴직금이 발생합니다.`;
  renderRows($('#result'), [
    ['재직일수', `${r.serviceDays.toLocaleString('ko-KR')}일`],
    ['평균임금 산정기간', `${r.periodDays}일`],
    ['1일 평균임금', won(r.averageDailyWage)],
    ['예상 퇴직금(세전)', r.eligible ? won(r.severance) : '0원', 'total'],
  ]);
});
