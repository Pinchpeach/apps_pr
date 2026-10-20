// 화면 회귀 테스트: 웹 export를 띄워 각 탭이 렌더링되고 계산 결과가 맞는지 확인한다.
// 실행: npx expo export --platform web --output-dir dist-web && node --test e2e/*.e2e.mjs
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

const PORT = 4190;
const base = `http://localhost:${PORT}`;
let server;
let browser;

before(async () => {
  server = await serve(process.env.WEB_DIR || 'dist-web', PORT);
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
});
after(async () => {
  await browser?.close();
  server?.close();
});

/** 새 페이지 + 오류 수집 + 보이는 결과 제목 읽기 */
async function open(path, ready = '[role=heading]:visible') {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base + path);
  await page.locator(ready).first().waitFor();
  const heads = () => page.locator('[role=heading]:visible').allTextContents();
  return { page, errors, heads };
}

test('환급 예상 탭 기본값', async () => {
  const { page, errors, heads } = await open('/');
  assert.deepEqual(await heads(), ['+362,120원']);
  await page.getByLabel('올해 프리랜서 총수입 (3.3% 떼기 전)').fill('30000000');
  assert.deepEqual(await heads(), ['+455,180원']);
  assert.deepEqual(errors, []);
});

test('N잡 세금 탭', async () => {
  const { errors, heads } = await open('/njob');
  assert.deepEqual(await heads(), ['-262,350원']);
  assert.deepEqual(errors, []);
});

test('3.3%·8.8% 탭: 역산과 기타소득', async () => {
  const { page, errors, heads } = await open('/withholding');
  assert.equal((await heads())[0], '967,000원');
  await page.getByRole('radio', { name: '실수령 → 청구할 세전' }).click();
  await page.getByLabel('받고 싶은 실수령액').fill('2000000');
  assert.equal((await heads())[0], '2,068,240원');
  await page.getByRole('radio', { name: '기타소득 8.8%' }).click();
  await page.getByLabel('세전 금액 (지급액)').fill('1000000');
  assert.equal((await heads())[0], '912,000원');
  assert.deepEqual(errors, []);
});

test('피부양자 탭과 지역가입자 보험료', async () => {
  const { errors, heads } = await open('/dependent');
  assert.deepEqual(await heads(), ['유지 가능', '29,200원']);
  assert.deepEqual(errors, []);
});

test('세금 일정 탭과 근로장려금 화면 이동', async () => {
  const { page, errors } = await open('/schedule', 'text=종합소득세 중간예납');
  assert.ok((await page.locator('text=/D-\\d+/').count()) >= 6);
  await page.getByRole('link', { name: '근로장려금 예상액 계산' }).click();
  await page.waitForURL('**/eitc');
  await page.getByText('가구 유형').waitFor();
  assert.deepEqual(await page.locator('[role=heading]:visible').allTextContents(), ['근로장려금', '1,421,538원']);
  assert.deepEqual(errors, []);
});

test('입력값은 다시 열어도 유지된다', async () => {
  const { page } = await open('/withholding');
  await page.getByLabel('세전 금액 (지급액)').fill('500000');
  await page.reload();
  await page.locator('[role=heading]:visible').first().waitFor();
  assert.equal(await page.getByLabel('세전 금액 (지급액)').inputValue(), '500,000');
});
