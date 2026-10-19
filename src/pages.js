import { calculator, money, number, date, segmented, select, checkbox, table } from './ui.js';
import { calcSalary, RATES } from './calc/salary.js';
import { MIN_WAGE } from './calc/wage.js';
import { calcSavings } from './calc/savings.js';

const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;

const SRC = {
  taxTable: ['소득세법 시행령 [별표 2] 근로소득 간이세액표 (2026.2.27 개정)', 'https://www.law.go.kr/법령/소득세법시행령'],
  nts: ['국세청 — 근로소득 원천징수방법(간이세액표)', 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6583&cntntsId=7862'],
  nps: ['국민연금공단 — 보험료 계산', 'https://www.nps.or.kr'],
  nhis: ['국민건강보험공단 — 보험료 산정', 'https://www.nhis.or.kr'],
  moel: ['고용노동부 — 퇴직금 계산', 'https://www.moel.go.kr/retirementpayCal.do'],
  minWage: ['최저임금위원회 — 2026년 적용 최저임금', 'https://www.minimumwage.go.kr'],
  brokerage: ['공인중개사법 시행규칙 [별표 1] 주택 중개보수 요율', 'https://www.law.go.kr/법령/공인중개사법시행규칙'],
};

/** @typedef {{slug:string, title:string, h1:string, description:string, category:string, icon:string, script?:string, body:string, article:string, faq?:[string,string][], sources?:[string,string][], updated:string}} Page */

/** @type {Page[]} */
export const pages = [
  {
    slug: 'salary',
    category: '급여·세금',
    icon: '💰',
    title: '2026 연봉 실수령액 계산기 — 4대보험·소득세 자동 계산',
    h1: '연봉 실수령액 계산기',
    description:
      '연봉을 입력하면 2026년 4대보험 요율과 국세청 근로소득 간이세액표로 월 실수령액을 계산합니다. 국민연금·건강보험·고용보험·소득세를 항목별로 확인하세요.',
    script: 'salary',
    updated: '2026-10-19',
    body: calculator([
      money('annual', '연봉 (세전, 퇴직금 별도)', '40,000,000'),
      money('nonTaxable', '월 비과세액 (식대 등)', '200,000', { hint: '식대는 월 20만원까지 비과세입니다.' }),
      number('family', '공제대상 가족 수 (본인 포함)', 1, '명', { step: 1, min: 1 }),
      number('children', '8세 이상 20세 이하 자녀 수', 0, '명', { step: 1 }),
      select('withholdingRate', '원천징수 비율', [['0.8', '80%'], ['1', '100% (기본)'], ['1.2', '120%']], '1'),
    ]),
    article: `
<h2>계산 방법</h2>
<p>월 실수령액은 <strong>월 급여 − 4대보험 − 근로소득세 − 지방소득세</strong>입니다. 이 계산기는 회사가 매달 원천징수할 때 쓰는
<strong>국세청 근로소득 간이세액표(2026년 2월 27일 개정) 원문 646개 구간</strong>을 그대로 사용하므로, 근사식을 쓰는 계산기보다 급여명세서와 더 가깝게 맞습니다.</p>
<ul>
  <li><strong>국민연금</strong>: 기준소득월액 × 4.75% (기준소득월액 하한 ${won(RATES.pensionBaseMin)}, 상한 ${won(RATES.pensionBaseMax)} — 2026년 7월~2027년 6월 적용)</li>
  <li><strong>건강보험</strong>: 보수월액 × 3.595% (전체 7.19%를 회사와 절반씩 부담)</li>
  <li><strong>장기요양보험</strong>: 건강보험료 × 13.14%</li>
  <li><strong>고용보험</strong>: 보수월액 × 0.9%</li>
  <li><strong>근로소득세</strong>: 간이세액표에서 월 과세급여와 공제대상 가족 수로 조회, 8~20세 자녀 1명 20,830원·2명 45,830원·3명 이상은 1명당 33,330원 추가 공제</li>
  <li><strong>지방소득세</strong>: 근로소득세 × 10%</li>
</ul>
<h2>실수령액이 급여명세서와 다른 이유</h2>
<p>회사마다 비과세 항목(식대, 자가운전보조금, 육아수당 등)과 보험료 정산 시점이 다르고, 국민연금은 전년도 소득을 기준으로 매년 7월에 기준소득월액이 바뀝니다.
연말정산 결과에 따라 실제 1년 세금은 달라질 수 있으므로 이 결과는 <em>매달 원천징수되는 금액의 추정치</em>입니다.</p>
<p>연봉 구간별 금액을 한눈에 보고 싶다면 <a href="../salary-table/">2026 연봉 실수령액 표</a>를 참고하세요.</p>`,
    faq: [
      ['연봉 4,000만원이면 월 실수령액은 얼마인가요?', `비과세 식대 20만원, 부양가족 1명(본인) 기준으로 월 약 ${won(calcSalary({ annual: 40_000_000 }).net)}입니다.`],
      ['공제대상 가족 수는 어떻게 세나요?', '본인을 포함해 기본공제 대상인 배우자·부양가족을 모두 셉니다. 맞벌이 배우자처럼 소득이 있어 기본공제를 받지 못하는 가족은 제외합니다.'],
      ['원천징수 비율 80%·120%는 무엇인가요?', '근로자가 간이세액표 금액의 80%, 100%, 120% 중에서 선택할 수 있습니다. 80%를 고르면 매달 받는 돈은 늘지만 연말정산 때 추가 납부할 가능성이 커집니다.'],
      ['퇴직금 포함 연봉이면 어떻게 하나요?', '퇴직금이 포함된 연봉이라면 연봉을 13으로 나눈 금액의 12배를 입력하세요.'],
    ],
    sources: [SRC.taxTable, SRC.nts, SRC.nps, SRC.nhis],
  },
  {
    slug: 'loan',
    category: '대출·금융',
    icon: '🏦',
    title: '대출이자 계산기 — 원리금균등·원금균등·만기일시 상환표',
    h1: '대출이자 계산기',
    description:
      '대출금액·금리·기간을 입력하면 원리금균등, 원금균등, 만기일시 상환 방식별 월 상환액과 총 이자, 회차별 상환 스케줄을 보여줍니다. 거치기간도 지원합니다.',
    script: 'loan',
    updated: '2026-10-19',
    body: calculator(
      [
        money('principal', '대출 금액', '100,000,000'),
        number('rate', '연 이자율', 4.5, '%', { step: 0.01 }),
        number('years', '대출 기간', 30, '년', { step: 0.5 }),
        number('grace', '거치 기간 (이자만 납부)', 0, '년', { step: 0.5 }),
        segmented('method', '상환 방식', [['equalPayment', '원리금균등'], ['equalPrincipal', '원금균등'], ['bullet', '만기일시']], 'equalPayment'),
      ],
      {
        extra: `<details class="card schedule" id="schedule"><summary>회차별 상환 스케줄 보기</summary>${table(['회차', '납입액', '원금', '이자', '잔액'], [], 'num')}</details>`,
      },
    ),
    article: `
<h2>상환 방식 비교</h2>
<ul>
  <li><strong>원리금균등</strong>: 매달 같은 금액을 냅니다. 초반에는 이자 비중이 크고 갈수록 원금 비중이 커집니다. 주택담보대출에서 가장 흔합니다.</li>
  <li><strong>원금균등</strong>: 매달 같은 원금에 남은 잔액의 이자를 더해 냅니다. 첫 달 부담이 가장 크지만 총 이자는 원리금균등보다 적습니다.</li>
  <li><strong>만기일시</strong>: 매달 이자만 내고 만기에 원금을 한 번에 갚습니다. 총 이자가 가장 많습니다. 신용대출·마이너스통장에서 주로 씁니다.</li>
</ul>
<h2>계산 공식</h2>
<p>원리금균등 월 상환액 = 대출원금 × r × (1+r)<sup>n</sup> ÷ ((1+r)<sup>n</sup> − 1) (r = 연이율 ÷ 12, n = 상환 개월 수)</p>
<p>은행은 일할 계산이나 원 단위 절사 방식이 달라 실제 납입액과 몇 원 차이가 날 수 있습니다. 중도상환수수료와 보증료는 포함하지 않았습니다.</p>`,
    faq: [
      ['원리금균등과 원금균등 중 무엇이 유리한가요?', '총 이자는 원금균등이 적습니다. 다만 초기 월 납입액이 크기 때문에 매달 고정된 지출을 원한다면 원리금균등이 관리하기 쉽습니다.'],
      ['거치기간이란 무엇인가요?', '원금은 갚지 않고 이자만 내는 기간입니다. 거치기간이 끝나면 남은 기간 동안 원금을 나눠 갚으므로 월 납입액이 커지고 총 이자도 늘어납니다.'],
    ],
  },
  {
    slug: 'savings',
    category: '대출·금융',
    icon: '🐷',
    title: '적금 이자 계산기·예금 이자 계산기 — 단리/복리, 세후 수령액',
    h1: '적금·예금 이자 계산기',
    description:
      '적금 월 납입액 또는 예금 원금과 금리, 기간을 입력하면 단리·월복리 이자와 이자소득세(15.4%)를 뺀 세후 만기 수령액을 계산합니다. 비과세·세금우대도 지원합니다.',
    script: 'savings',
    updated: '2026-10-19',
    body: calculator([
      segmented('kind', '상품 종류', [['installment', '적금 (매월 납입)'], ['deposit', '예금 (목돈 예치)']], 'installment'),
      money('amount', '월 납입액', '500,000'),
      number('rate', '연 이자율', 3.5, '%', { step: 0.01 }),
      number('months', '기간', 12, '개월', { step: 1, min: 1 }),
      select('tax', '과세 방식', [['normal', '일반과세 15.4%'], ['preferential', '세금우대 9.5%'], ['free', '비과세 0%']], 'normal'),
      checkbox('compound', '월복리로 계산'),
    ]),
    article: `
<h2>적금 이자가 생각보다 적은 이유</h2>
<p>적금은 매달 넣은 돈마다 이자가 붙는 기간이 다릅니다. 첫 달에 넣은 돈은 12개월, 마지막 달에 넣은 돈은 1개월만 이자가 붙습니다.
그래서 <strong>연 5% 적금의 실제 수익률은 원금 대비 약 2.7%</strong> 수준입니다.</p>
<p>단리 적금 이자 = 월 납입액 × (연이율 ÷ 12) × n(n+1) ÷ 2</p>
<h2>이자소득세</h2>
<p>일반 예·적금 이자에는 소득세 14%와 지방소득세 1.4%를 합친 <strong>15.4%</strong>가 원천징수됩니다.
세금우대 상품은 9.5%(농어촌특별세 포함), 비과세종합저축·청년도약계좌 등은 비과세입니다.</p>`,
    faq: [
      [
        '월 50만원씩 1년 적금하면 이자는 얼마인가요?',
        (({ interest, afterTaxInterest }) =>
          `연 3.5% 단리 기준 세전 이자 ${won(interest)}, 일반과세 15.4%를 뺀 세후 이자는 ${won(afterTaxInterest)}입니다.`)(
          calcSavings({ kind: 'installment', amount: 500_000, annualRate: 0.035, months: 12 }),
        ),
      ],
      ['단리와 월복리 차이가 큰가요?', '1~2년 짧은 기간에는 차이가 몇천 원 수준으로 작습니다. 기간이 길고 금액이 클수록 차이가 커집니다.'],
    ],
  },
  {
    slug: 'severance',
    category: '급여·세금',
    icon: '📦',
    title: '퇴직금 계산기 2026 — 평균임금·재직일수로 정확히 계산',
    h1: '퇴직금 계산기',
    description:
      '입사일, 마지막 근무일, 최근 3개월 급여를 입력하면 근로자퇴직급여 보장법 기준 1일 평균임금과 예상 퇴직금을 계산합니다. 상여금과 연차수당도 반영합니다.',
    script: 'severance',
    updated: '2026-10-19',
    body: calculator([
      date('start', '입사일', '2022-03-02'),
      date('end', '마지막 근무일', '2026-10-31'),
      money('wages3m', '퇴직 전 3개월 급여 총액 (세전)', '10,500,000', { hint: '기본급과 고정·변동 수당을 모두 더한 금액' }),
      money('bonus', '최근 1년 상여금 총액', '0'),
      money('leavePay', '최근 1년 연차수당 총액', '0'),
    ]),
    article: `
<h2>퇴직금 계산 공식</h2>
<p><strong>퇴직금 = 1일 평균임금 × 30일 × (재직일수 ÷ 365)</strong></p>
<ul>
  <li><strong>1일 평균임금</strong> = (퇴직 전 3개월 임금 총액 + 연간 상여금 × 3/12 + 연차수당 × 3/12) ÷ 퇴직 전 3개월 일수</li>
  <li><strong>재직일수</strong>: 입사일부터 퇴직일(마지막 근무일 다음 날) 전날까지</li>
  <li>계속근로기간이 <strong>1년 이상</strong>이고 4주 평균 주 15시간 이상 일했다면 정규직·계약직·아르바이트 모두 받을 수 있습니다.</li>
</ul>
<p>평균임금이 통상임금보다 적으면 통상임금으로 계산해야 합니다. 퇴직소득세는 반영하지 않은 세전 금액이며, 정확한 금액은 고용노동부 퇴직금 계산기로 확인하세요.</p>`,
    faq: [
      ['퇴직금은 언제까지 받아야 하나요?', '퇴직일로부터 14일 이내에 지급해야 합니다. 당사자 합의가 있으면 기한을 연장할 수 있습니다.'],
      ['1년에서 하루 모자라면 퇴직금이 없나요?', '네. 계속근로기간이 1년(365일) 미만이면 법정 퇴직금 지급 의무가 없습니다.'],
    ],
    sources: [SRC.moel],
  },
  {
    slug: 'brokerage',
    category: '부동산',
    icon: '🏠',
    title: '부동산 중개수수료 계산기 — 매매·전세·월세 복비 상한',
    h1: '부동산 중개수수료(복비) 계산기',
    description:
      '주택 매매·전세·월세 거래금액을 입력하면 2021년 개정 요율표 기준 중개보수 상한액을 계산합니다. 월세 거래금액 환산과 부가세도 함께 보여줍니다.',
    script: 'brokerage',
    updated: '2026-10-19',
    body: calculator([
      segmented('type', '거래 종류', [['sale', '매매'], ['jeonse', '전세'], ['monthly', '월세']], 'sale'),
      money('price', '매매가', '500,000,000'),
      money('deposit', '보증금', '200,000,000', { hidden: true }),
      money('rent', '월세', '500,000', { hidden: true }),
    ]),
    article: `
<h2>주택 중개보수 상한 요율 (2021.10.19 시행)</h2>
${table(
  ['거래금액', '매매·교환', '임대차(전세·월세)'],
  [
    ['5천만원 미만', '0.6% (한도 25만원)', '0.5% (한도 20만원)'],
    ['5천만원~1억원 미만', '0.5% (한도 80만원)', '0.4% (한도 30만원)'],
    ['1억원~2억원 미만', '0.5% (한도 80만원)', '0.3%'],
    ['2억원~6억원 미만', '0.4%', '0.3%'],
    ['6억원~9억원 미만', '0.4%', '0.4%'],
    ['9억원~12억원 미만', '0.5%', '0.4%'],
    ['12억원~15억원 미만', '0.6%', '0.5%'],
    ['15억원 이상', '0.7%', '0.6%'],
  ],
)}
<p>표의 요율은 <strong>상한</strong>이며 실제 보수는 중개사와 협의해 정합니다. 오피스텔(주거용, 일정 요건 충족)은 매매 0.5%, 임대차 0.4%가 상한입니다.</p>
<h2>월세 거래금액 계산</h2>
<p>월세는 <strong>보증금 + 월세 × 100</strong>을 거래금액으로 봅니다. 이 금액이 5천만원 미만이면 <strong>보증금 + 월세 × 70</strong>으로 다시 계산합니다.</p>`,
    faq: [
      ['중개수수료에 부가세가 붙나요?', '중개사무소가 일반과세자라면 10%, 간이과세자라면 업종별 부가가치율에 따라 더 낮은 세율이 붙을 수 있습니다.'],
      ['5억 아파트 매매 복비는 얼마인가요?', '5억원 × 0.4% = 200만원이 상한이며 부가세는 별도입니다.'],
    ],
    sources: [SRC.brokerage],
  },
  {
    slug: 'wage',
    category: '급여·세금',
    icon: '⏰',
    title: `시급 월급 계산기 — ${MIN_WAGE.year} 최저임금·주휴수당 포함`,
    h1: '시급·월급 계산기 (주휴수당 포함)',
    description: `시급을 월급으로, 월급을 시급으로 환산합니다. 주휴수당과 ${MIN_WAGE.year}년 최저임금(${MIN_WAGE.hourly.toLocaleString('ko-KR')}원) 충족 여부를 함께 확인하세요.`,
    script: 'wage',
    updated: '2026-10-19',
    body: calculator([
      segmented('direction', '계산 방향', [['hourly', '시급 → 월급'], ['monthly', '월급 → 시급']], 'hourly'),
      money('hourly', '시급', MIN_WAGE.hourly.toLocaleString('ko-KR')),
      money('monthly', '월급 (세전)', '2,500,000', { hidden: true }),
      number('weeklyHours', '주 소정근로시간', 40, '시간', { step: 0.5 }),
    ]),
    article: `
<h2>${MIN_WAGE.year}년 최저임금</h2>
<p>${MIN_WAGE.year}년 최저임금은 <strong>시간당 ${won(MIN_WAGE.hourly)}</strong>, 주 40시간 근무 시 월 <strong>${won(MIN_WAGE.hourly * 209)}</strong>(209시간 기준, 주휴수당 포함)입니다.</p>
<h2>주휴수당과 209시간</h2>
<p>1주 소정근로시간이 15시간 이상이고 그 주를 개근하면 1일분 임금을 주휴수당으로 받습니다. 주휴시간 = 주 소정근로시간 ÷ 40 × 8 (최대 8시간).</p>
<p>월 유급시간 = (주 근로시간 + 주휴시간) × 365 ÷ 7 ÷ 12 → 주 40시간이면 (40 + 8) × 4.345 ≈ <strong>209시간</strong>입니다.</p>`,
    faq: [
      ['주 15시간 미만이면 주휴수당이 없나요?', '네. 4주 평균 1주 소정근로시간이 15시간 미만인 초단시간 근로자는 주휴수당과 연차휴가가 적용되지 않습니다.'],
      ['월급이 최저임금에 미달하는지 어떻게 확인하나요?', '월급 → 시급으로 계산한 금액이 최저시급보다 낮으면 미달입니다. 이때 식대 등 일부 복리후생비는 최저임금 산입 범위에서 빠질 수 있습니다.'],
    ],
    sources: [SRC.minWage],
  },
  {
    slug: 'percent',
    category: '생활',
    icon: '％',
    title: '퍼센트 계산기 — 비율, 증감률, 할인율 한 번에',
    h1: '퍼센트 계산기',
    description: 'A의 B%는 얼마인지, A는 B의 몇 %인지, A에서 B로 몇 % 올랐는지, 할인·인상 후 금액까지 4가지 퍼센트 계산을 한 페이지에서 바로 해보세요.',
    script: 'percent',
    updated: '2026-10-19',
    body: `<div class="percent-grid">
${[
  ['of', '', '의', '%는?', 200, 15],
  ['ratio', '', '은(는)', '의 몇 %?', 30, 200],
  ['change', '', '에서', '(으)로 변하면 몇 %?', 200, 250],
  ['apply', '', '을(를)', '% 증감하면? (할인은 음수)', 50000, -20],
]
  .map(
    ([op, , mid, tail, a, b]) => `<form class="card percent-row" data-op="${op}">
  <input name="a" type="number" step="any" value="${a}" aria-label="첫 번째 값"><span>${mid}</span>
  <input name="b" type="number" step="any" value="${b}" aria-label="두 번째 값"><span>${tail}</span>
  <output class="percent-out" aria-live="polite"></output>
</form>`,
  )
  .join('\n')}
</div>`,
    article: `
<h2>퍼센트 공식</h2>
<ul>
  <li>A의 B% = A × B ÷ 100</li>
  <li>A는 B의 몇 % = A ÷ B × 100</li>
  <li>증감률 = (바뀐 값 − 원래 값) ÷ 원래 값 × 100</li>
  <li>할인 후 가격 = 원래 가격 × (1 − 할인율 ÷ 100)</li>
</ul>
<p>퍼센트포인트(%p)는 비율끼리의 차이입니다. 금리가 3%에서 4%로 오르면 1%p 상승, 증가율로는 33.3% 상승입니다.</p>`,
    faq: [['20% 할인 후 다시 20% 올리면 원래 가격이 되나요?', '아닙니다. 10,000원을 20% 할인하면 8,000원이고, 여기서 20% 올리면 9,600원입니다. 기준 금액이 달라지기 때문입니다.']],
  },
  {
    slug: 'dday',
    category: '생활',
    icon: '📅',
    title: 'D-day 계산기 — 날짜 차이, 며칠째, 기념일 계산',
    h1: 'D-day·날짜 계산기',
    description: '두 날짜 사이 일수, D-day, 오늘부터 며칠째인지, 100일·1000일 같은 기념일 날짜를 바로 계산합니다.',
    script: 'dday',
    updated: '2026-10-19',
    body: calculator([
      date('base', '기준일 (시작일)'),
      date('target', '목표일'),
      number('offset', '기준일부터 며칠 뒤', 100, '일', { step: 1, min: -100000 }),
    ]),
    article: `
<h2>D-day 세는 법</h2>
<p>목표일 당일이 D-Day, 하루 전이 D-1, 하루 뒤가 D+1입니다. 사귄 날·태어난 날처럼 <strong>첫날을 1일로 세는 기념일</strong>은 기준일 + (N − 1)일이 N일째가 됩니다.
예를 들어 2026년 1월 1일에 시작했다면 100일째는 4월 10일입니다.</p>`,
    faq: [['100일은 99일 뒤인가요, 100일 뒤인가요?', '연애·출생 기념일처럼 시작일을 1일로 세면 99일 뒤가 100일째입니다. 계약 기간처럼 시작일 다음 날부터 세면 100일 뒤입니다.']],
  },
];

/** 연봉 실수령액 표 (빌드 시 계산) */
function salaryTablePage() {
  const rows = [];
  for (let annual = 20_000_000; annual <= 150_000_000; annual += annual < 100_000_000 ? 1_000_000 : 5_000_000) {
    const r = calcSalary({ annual });
    rows.push([
      `<a href="../salary/?annual=${annual}">${(annual / 10_000).toLocaleString('ko-KR')}만원</a>`,
      won(r.pension),
      won(r.health + r.longTermCare),
      won(r.employment),
      won(r.incomeTax + r.localIncomeTax),
      `<strong>${won(r.net)}</strong>`,
    ]);
  }
  return {
    slug: 'salary-table',
    category: '급여·세금',
    icon: '📊',
    title: '2026 연봉 실수령액 표 — 2,000만원부터 1억 5천만원까지',
    h1: '2026 연봉 실수령액 표',
    description:
      '2026년 4대보험 요율과 근로소득 간이세액표를 적용한 연봉별 월 실수령액 표입니다. 연봉 2,000만원부터 1억 5천만원까지 국민연금·건강보험·소득세를 한눈에 비교하세요.',
    updated: '2026-10-19',
    body: `<p class="lead">기준: 비과세 식대 월 20만원, 공제대상 가족 1명(본인), 8~20세 자녀 없음. 금액을 누르면 조건을 바꿔 다시 계산할 수 있습니다.</p>
${table(['연봉', '국민연금', '건강+장기요양', '고용보험', '소득세+지방세', '월 실수령액'], rows, 'num sticky')}`,
    article: `<p>표의 소득세는 매달 원천징수되는 금액이며 연말정산 결과에 따라 실제 세금은 달라질 수 있습니다. 부양가족이나 비과세 수당이 다르다면 <a href="../salary/">연봉 실수령액 계산기</a>에서 직접 계산해 보세요.</p>`,
    faq: [
      ['연봉 5,000만원 실수령액은?', `월 약 ${won(calcSalary({ annual: 50_000_000 }).net)}입니다 (본인 1인, 식대 비과세 20만원 기준).`],
      ['연봉 1억 실수령액은?', `월 약 ${won(calcSalary({ annual: 100_000_000 }).net)}입니다 (본인 1인, 식대 비과세 20만원 기준).`],
    ],
    sources: [SRC.taxTable, SRC.nps, SRC.nhis],
  };
}

pages.splice(1, 0, salaryTablePage());
