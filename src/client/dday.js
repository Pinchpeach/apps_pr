import { calcDday, parseDate, addDays, formatDate } from '../calc/date.js';
import { $, bindCalculator, readNumber, renderRows } from './common.js';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const pretty = (d) => `${formatDate(d)} (${WEEKDAYS[d.getUTCDay()]})`;
const today = new Date();
const todayText = formatDate(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())));

const form = $('#calc');
if (!form.base.value) form.base.value = todayText;
if (!form.target.value) form.target.value = `${today.getFullYear()}-12-25`;

bindCalculator(form, (f) => {
  const base = parseDate(f.base.value);
  const target = parseDate(f.target.value);
  if (!base || !target) return;
  const r = calcDday(base, target);
  const offset = Math.round(readNumber(f.offset));
  $('#headline').textContent = r.label;
  $('#subline').textContent = `${pretty(base)} → ${pretty(target)}`;
  renderRows($('#result'), [
    ['두 날짜 차이', `${Math.abs(r.diff).toLocaleString('ko-KR')}일`],
    ['시작일을 1일로 셀 때', `${Math.abs(r.diff) + 1}일째`],
    [`기준일 + ${offset}일`, pretty(addDays(base, offset)), 'total'],
    [`기준일로부터 ${offset}일째 (기념일 계산)`, pretty(addDays(base, offset - 1))],
  ]);
});
