import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcAcquisitionTax, baseHousingRate, surchargeRate } from '../src/calc/acquisition.js';
import { calcUnemployment, benefitDays } from '../src/calc/unemployment.js';
import { vatFromSupply, vatFromTotal } from '../src/calc/vat.js';
import { jeonseToMonthly, monthlyToJeonse, impliedRate, legalConversionCap } from '../src/calc/rent.js';

test('주택 취득세 기본세율', () => {
  assert.equal(baseHousingRate(600_000_000), 0.01);
  assert.equal(baseHousingRate(700_000_000), 0.0167);
  assert.equal(baseHousingRate(750_000_000), 0.02);
  assert.equal(baseHousingRate(900_000_000), 0.03);
  const r = calcAcquisitionTax({ price: 700_000_000 });
  assert.equal(r.acquisition, 11_690_000);
  assert.equal(r.education, 1_169_000);
  assert.equal(calcAcquisitionTax({ price: 1_000_000_000, over85: true }).total, 35_000_000);
});

test('다주택 중과와 생애최초 감면', () => {
  assert.equal(surchargeRate(2, true), 0.08);
  assert.equal(surchargeRate(2, false), 0);
  assert.equal(surchargeRate(3, false), 0.08);
  assert.equal(surchargeRate(4, false), 0.12);
  assert.equal(calcAcquisitionTax({ price: 700_000_000, houses: 2, regulated: true, over85: true }).total, 63_000_000);
  assert.equal(calcAcquisitionTax({ price: 1_000_000_000, houses: 3, regulated: true, over85: true }).total, 134_000_000);
  const first = calcAcquisitionTax({ price: 300_000_000, firstHome: true });
  assert.equal(first.relief, 2_000_000);
  assert.equal(first.total, 1_000_000 + 300_000);
  assert.equal(calcAcquisitionTax({ price: 1_300_000_000, firstHome: true }).relief, 0);
});

test('실업급여 상·하한과 소정급여일수', () => {
  assert.equal(benefitDays(0.5, false), 120);
  assert.equal(benefitDays(3, false), 180);
  assert.equal(benefitDays(10, true), 270);
  const low = calcUnemployment({ wages3m: 6_000_000, insuredYears: 2 });
  assert.equal(low.daily, 66_048);
  assert.equal(low.capped, 'min');
  const high = calcUnemployment({ wages3m: 20_000_000, insuredYears: 12, over50: true });
  assert.equal(high.daily, 68_100);
  assert.equal(high.total, 68_100 * 270);
  assert.equal(calcUnemployment({ wages3m: 3_000_000, dailyHours: 4, insuredYears: 1 }).minDaily, 33_024);
});

test('부가세', () => {
  assert.deepEqual(vatFromSupply(10_000), { supply: 10_000, vat: 1_000, total: 11_000 });
  assert.deepEqual(vatFromTotal(11_000), { supply: 10_000, vat: 1_000, total: 11_000 });
  assert.deepEqual(vatFromTotal(10_000), { supply: 9_091, vat: 909, total: 10_000 });
});

test('전월세 전환', () => {
  assert.equal(legalConversionCap(0.03), 0.05);
  assert.equal(legalConversionCap(0.09), 0.1);
  assert.equal(jeonseToMonthly({ jeonse: 300_000_000, deposit: 100_000_000, rate: 0.05 }), 833_333);
  assert.equal(monthlyToJeonse({ deposit: 100_000_000, monthly: 1_000_000, rate: 0.05 }), 340_000_000);
  assert.ok(Math.abs(impliedRate({ jeonse: 300_000_000, deposit: 100_000_000, monthly: 1_000_000 }) - 0.06) < 1e-12);
});
