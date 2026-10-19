import { percentOf, ratioPercent, changePercent, applyPercent } from '../calc/percent.js';
import { $, readNumber } from './common.js';

const fmt = (n) => (Number.isFinite(n) ? Number(n.toFixed(4)).toLocaleString('ko-KR', { maximumFractionDigits: 4 }) : '-');
const ops = {
  of: (a, b) => fmt(percentOf(a, b)),
  ratio: (a, b) => `${fmt(ratioPercent(a, b))}%`,
  change: (a, b) => {
    const v = changePercent(a, b);
    return Number.isFinite(v) ? `${v > 0 ? '+' : ''}${fmt(v)}% ${v > 0 ? '증가' : v < 0 ? '감소' : ''}`.trim() : '-';
  },
  apply: (a, b) => fmt(applyPercent(a, b)),
};

for (const form of document.querySelectorAll('form[data-op]')) {
  const out = form.querySelector('output');
  const run = () => (out.textContent = ops[form.dataset.op](readNumber(form.a), readNumber(form.b)));
  form.addEventListener('input', run);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run();
  });
  run();
}
