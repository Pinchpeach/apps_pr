import { jeonseToMonthly, monthlyToJeonse, impliedRate, legalConversionCap } from '../calc/rent.js';
import { $, bindCalculator, readNumber, renderRows, won } from './common.js';

const pct = (r) => `${Number((r * 100).toFixed(2))}%`;

bindCalculator($('#calc'), (form) => {
  const mode = form.mode.value;
  $('#jeonse-field').hidden = mode === 'toJeonse';
  $('#monthly-field').hidden = mode === 'toMonthly';
  $('#rate-field').hidden = mode === 'rate';
  const jeonse = readNumber(form.jeonse);
  const deposit = readNumber(form.deposit);
  const monthly = readNumber(form.monthly);
  const rate = readNumber(form.rate) / 100;
  const cap = legalConversionCap();
  if (mode === 'toMonthly') {
    const m = jeonseToMonthly({ jeonse, deposit, rate });
    $('#headline').textContent = `월 ${won(m)}`;
    $('#subline').textContent = `보증금 ${won(deposit)} / 전환율 ${pct(rate)}`;
    renderRows($('#result'), [
      ['월세로 바뀌는 보증금', won(Math.max(0, jeonse - deposit))],
      ['적정 월세', won(m), 'total'],
      [`법정 상한(${pct(cap)}) 기준 최대 월세`, won(jeonseToMonthly({ jeonse, deposit, rate: cap }))],
    ]);
  } else if (mode === 'toJeonse') {
    const j = monthlyToJeonse({ deposit, monthly, rate });
    $('#headline').textContent = Number.isFinite(j) ? won(j) : '-';
    $('#subline').textContent = `월세 ${won(monthly)} / 전환율 ${pct(rate)}`;
    renderRows($('#result'), [['환산 전세 보증금', Number.isFinite(j) ? won(j) : '-', 'total']]);
  } else {
    const r = impliedRate({ jeonse, deposit, monthly });
    const over = r > cap;
    $('#headline').textContent = Number.isFinite(r) ? pct(r) : '-';
    $('#subline').textContent = Number.isFinite(r) ? (over ? `법정 상한 ${pct(cap)}보다 높습니다` : `법정 상한 ${pct(cap)} 이내`) : '전세 보증금이 월세 보증금보다 커야 합니다';
    renderRows($('#result'), [
      ['실제 전환율', Number.isFinite(r) ? pct(r) : '-', over ? 'warn' : 'total'],
      ['법정 상한', pct(cap)],
    ]);
  }
});
