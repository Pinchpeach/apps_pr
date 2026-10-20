import { checkDependent } from '../calc/freelancer.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

bindCalculator($('#calc'), (form) => {
  const registered = form.registered.value === 'yes';
  const revenue = readNumber(form.revenue);
  const businessIncome = Math.floor(revenue * (1 - readNumber(form.expenseRate) / 100));
  const r = checkDependent({
    businessIncome,
    registered,
    wageIncome: readNumber(form.wageIncome),
    pensionIncome: readNumber(form.pensionIncome),
    financialIncome: readNumber(form.financialIncome),
    propertyBase: readNumber(form.propertyBase),
  });
  $('#headline').textContent = r.eligible ? '유지 가능' : '탈락 예상';
  $('#headline').classList.toggle('negative', !r.eligible);
  $('#subline').textContent = r.eligible
    ? registered
      ? '사업자등록이 있으면 사업소득이 생기는 순간 탈락합니다.'
      : `소득금액 기준 ${won(r.headroom)} 더 벌어도 유지됩니다.`
    : r.reasons[0];
  renderRows($('#result'), [
    ['사업소득금액 (수입 − 경비)', won(businessIncome)],
    ['합산소득', won(r.total)],
    ...r.reasons.slice(1).map((reason) => ['추가 사유', reason, 'warn']),
    ['판정', r.eligible ? '피부양자 유지' : '지역가입자 전환', r.eligible ? 'total' : 'total warn'],
  ]);
});
