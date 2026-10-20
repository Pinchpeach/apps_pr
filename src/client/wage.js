import { hourlyToPay, monthlyToHourly, MIN_WAGE } from '../calc/wage.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

bindCalculator($('#calc'), (form) => {
  const weeklyHours = readNumber(form.weeklyHours);
  const toMonthly = form.direction.value === 'hourly';
  $('#hourly-field').hidden = !toMonthly;
  $('#monthly-field').hidden = toMonthly;
  if (toMonthly) {
    const r = hourlyToPay({ hourly: readNumber(form.hourly), weeklyHours });
    $('#headline').textContent = won(r.monthly);
    $('#subline').textContent = `월 ${r.monthlyHours}시간 기준 (주휴수당 포함)`;
    renderRows($('#result'), [
      ['주휴수당(주)', won(r.holidayPay)],
      ['주급', won(r.weekly)],
      ['월 유급시간', `${r.monthlyHours}시간`],
      ['월급', won(r.monthly), 'total'],
      ['연봉 환산', won(r.annual)],
      [`${MIN_WAGE.year} 최저시급 ${won(MIN_WAGE.hourly)}`, r.belowMinimum ? '미달' : '충족', r.belowMinimum ? 'warn' : ''],
    ]);
  } else {
    const r = monthlyToHourly({ monthly: readNumber(form.monthly), weeklyHours });
    $('#headline').textContent = won(r.hourly);
    $('#subline').textContent = `월 ${r.monthlyHours}시간(주휴 포함)으로 나눈 시급`;
    renderRows($('#result'), [
      ['월 유급시간', `${r.monthlyHours}시간`],
      ['환산 시급', won(r.hourly), 'total'],
      [`${MIN_WAGE.year} 최저시급 ${won(MIN_WAGE.hourly)}`, r.belowMinimum ? '미달' : '충족', r.belowMinimum ? 'warn' : ''],
    ]);
  }
});
