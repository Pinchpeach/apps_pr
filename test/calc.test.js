import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcSalary, monthlyIncomeTax } from '../src/calc/salary.js';
import { calcLoan } from '../src/calc/loan.js';
import { calcSavings } from '../src/calc/savings.js';
import { calcSeverance } from '../src/calc/severance.js';
import { calcBrokerage } from '../src/calc/brokerage.js';
import { hourlyToPay, monthlyToHourly } from '../src/calc/wage.js';
import { calcDday, parseDate, addMonths, formatDate } from '../src/calc/date.js';
import { percentOf, ratioPercent, changePercent, applyPercent } from '../src/calc/percent.js';

test('간이세액표 값과 일치한다 (2026.2.27 개정 별표2)', () => {
  assert.equal(monthlyIncomeTax(2_800_000, 1), 56_800);
  assert.equal(monthlyIncomeTax(3_000_000, 1), 74_350);
  assert.equal(monthlyIncomeTax(3_019_999, 2), 56_850);
  assert.equal(monthlyIncomeTax(5_000_000, 1), 335_470);
  assert.equal(monthlyIncomeTax(5_000_000, 11), 87_850);
  assert.equal(monthlyIncomeTax(1_000_000, 1), 0);
  assert.equal(monthlyIncomeTax(10_000_000, 1), 1_507_400);
});

test('1,000만원 초과 구간 산식과 자녀세액공제', () => {
  // 1,507,400 + 500,000 × 98% × 35% + 25,000
  assert.equal(monthlyIncomeTax(10_500_000, 1), 1_703_900);
  assert.equal(monthlyIncomeTax(5_000_000, 3, 1), 237_850 - 20_830);
  assert.equal(monthlyIncomeTax(5_000_000, 3, 3), 237_850 - 45_830 - 33_330);
  assert.equal(monthlyIncomeTax(2_800_000, 11, 3), 0);
});

test('연봉 3,600만원 실수령액', () => {
  const r = calcSalary({ annual: 36_000_000 });
  assert.equal(r.taxable, 2_800_000);
  assert.equal(r.pension, 133_000);
  assert.equal(r.health, 100_660);
  assert.equal(r.longTermCare, 13_220);
  assert.equal(r.employment, 25_200);
  assert.equal(r.incomeTax, 56_800);
  assert.equal(r.localIncomeTax, 5_680);
  assert.equal(r.net, 3_000_000 - 334_560);
});

test('국민연금 기준소득월액 상한 적용', () => {
  const r = calcSalary({ annual: 120_000_000, nonTaxable: 0 });
  assert.equal(r.pension, Math.floor(6_590_000 * 0.0475 / 10) * 10);
});

test('원리금균등 1억 5% 30년', () => {
  const r = calcLoan({ principal: 100_000_000, annualRate: 0.05, months: 360, method: 'equalPayment' });
  assert.equal(r.firstPayment, 536_822);
  assert.equal(r.schedule.at(-1).balance, 0);
  assert.ok(Math.abs(r.totalInterest - 93_255_000) < 2_000);
});

test('원금균등·만기일시·거치기간', () => {
  const ep = calcLoan({ principal: 12_000_000, annualRate: 0.06, months: 12, method: 'equalPrincipal' });
  assert.equal(ep.schedule[0].payment, 1_000_000 + 60_000);
  assert.equal(ep.schedule.at(-1).balance, 0);
  const bullet = calcLoan({ principal: 12_000_000, annualRate: 0.06, months: 12, method: 'bullet' });
  assert.equal(bullet.totalInterest, 720_000);
  assert.equal(bullet.schedule.at(-1).principal, 12_000_000);
  const grace = calcLoan({ principal: 12_000_000, annualRate: 0.06, months: 24, method: 'equalPrincipal', graceMonths: 12 });
  assert.equal(grace.schedule[11].principal, 0);
  assert.equal(grace.firstPayment, 1_060_000);
  const zero = calcLoan({ principal: 1_200_000, annualRate: 0, months: 12, method: 'equalPayment' });
  assert.equal(zero.totalInterest, 0);
});

test('적금·예금 이자와 세금', () => {
  const inst = calcSavings({ kind: 'installment', amount: 100_000, annualRate: 0.03, months: 12 });
  assert.equal(inst.interest, 19_500);
  assert.equal(inst.tax, 3_000);
  assert.equal(inst.maturity, 1_200_000 + 16_500);
  const dep = calcSavings({ kind: 'deposit', amount: 10_000_000, annualRate: 0.036, months: 12, tax: 'free' });
  assert.equal(dep.interest, 360_000);
  assert.equal(dep.maturity, 10_360_000);
  const comp = calcSavings({ kind: 'deposit', amount: 10_000_000, annualRate: 0.036, months: 12, compound: true });
  assert.equal(comp.interest, 365_999);
});

test('퇴직금', () => {
  const r = calcSeverance({ start: parseDate('2020-01-01'), lastWorkDay: parseDate('2024-12-31'), wages3m: 9_000_000 });
  assert.equal(r.serviceDays, 1827);
  assert.equal(r.periodDays, 92);
  assert.equal(r.severance, 14_689_994);
  const short = calcSeverance({ start: parseDate('2024-01-01'), lastWorkDay: parseDate('2024-12-29'), wages3m: 9_000_000 });
  assert.equal(short.eligible, false);
});

test('중개보수 상한', () => {
  assert.equal(calcBrokerage({ type: 'sale', price: 500_000_000 }).fee, 2_000_000);
  assert.equal(calcBrokerage({ type: 'sale', price: 40_000_000 }).fee, 240_000);
  assert.equal(calcBrokerage({ type: 'sale', price: 100_000_000 }).fee, 500_000);
  assert.equal(calcBrokerage({ type: 'sale', price: 1_500_000_000 }).rate, 0.007);
  assert.equal(calcBrokerage({ type: 'jeonse', deposit: 300_000_000 }).fee, 900_000);
  assert.equal(calcBrokerage({ type: 'monthly', deposit: 10_000_000, monthlyRent: 500_000 }).fee, 240_000);
  const small = calcBrokerage({ type: 'monthly', deposit: 5_000_000, monthlyRent: 300_000 });
  assert.equal(small.amount, 26_000_000);
  assert.equal(small.fee, 130_000);
});

test('시급·월급 환산 (2026 최저임금)', () => {
  const r = hourlyToPay({ hourly: 10_320, weeklyHours: 40 });
  assert.equal(r.monthlyHours, 209);
  assert.equal(r.monthly, 2_156_880);
  assert.equal(r.holidayPay, 82_560);
  assert.equal(hourlyToPay({ hourly: 10_320, weeklyHours: 14 }).holidayPay, 0);
  assert.equal(monthlyToHourly({ monthly: 2_156_880, weeklyHours: 40 }).hourly, 10_320);
  assert.equal(hourlyToPay({ hourly: 10_000, weeklyHours: 40 }).belowMinimum, true);
});

test('날짜·D-day', () => {
  assert.equal(calcDday(parseDate('2026-10-19'), parseDate('2026-12-25')).label, 'D-67');
  assert.equal(calcDday(parseDate('2026-10-19'), parseDate('2026-10-19')).label, 'D-Day');
  assert.equal(calcDday(parseDate('2026-10-19'), parseDate('2026-10-01')).countingFromOne, 19);
  assert.equal(formatDate(addMonths(parseDate('2025-05-31'), -3)), '2025-02-28');
  assert.equal(parseDate('2026-02-30'), null);
});

test('퍼센트', () => {
  assert.equal(percentOf(200, 15), 30);
  assert.equal(ratioPercent(30, 200), 15);
  assert.equal(changePercent(200, 250), 25);
  assert.ok(Math.abs(applyPercent(200, -10) - 180) < 1e-9);
  assert.ok(Number.isNaN(ratioPercent(1, 0)));
});
