import { calculator, money, number, segmented, select, checkbox, table } from './ui.js';
import { calcIncomeTaxRefund, withholding33, INDUSTRY_PRESETS, SIMPLE_RATE_LIMITS, STANDARD_MULTIPLIER } from './calc/freelancer.js';

const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;
const pct = (r) => `${Number((r * 100).toFixed(1))}%`;
const CATEGORY = '프리랜서·N잡';

const SRC = {
  hometaxRate: ['홈택스 — 기준·단순경비율(업종코드) 조회', 'https://hometax.go.kr'],
  decree143: ['소득세법 시행령 제143조 (추계결정 및 경정)', 'https://www.law.go.kr/법령/소득세법시행령/제143조'],
  rule67: ['소득세법 시행규칙 제67조 (추계 시 배율)', 'https://www.law.go.kr/법령/소득세법시행규칙/제67조'],
  taxRate: ['소득세법 제55조 (세율)', 'https://www.law.go.kr/법령/소득세법/제55조'],
  nhisDependent: ['국민건강보험공단 — 피부양자 자격 인정 기준', 'https://www.nhis.or.kr'],
};

const sample = calcIncomeTaxRefund({ revenue: 20_000_000, rates: INDUSTRY_PRESETS[0] });

/** @type {import('./pages.js').Page[]} */
export const freelancerPages = [
  {
    slug: 'freelancer-33',
    category: CATEGORY,
    icon: '✂️',
    title: '3.3% 계산기 — 프리랜서 세전·세후 금액, 원천징수 역산',
    h1: '3.3% 프리랜서 계산기',
    short: '3.3% 계산',
    description:
      '프리랜서 사업소득 3.3% 원천징수(소득세 3% + 지방소득세 0.3%)를 계산합니다. 세전 금액으로 실수령액을, 받고 싶은 실수령액으로 청구할 세전 금액을 바로 구하세요.',
    script: 'freelancer33',
    updated: '2026-10-20',
    body: calculator([
      segmented('mode', '무엇을 알고 싶나요?', [['net', '세전 → 실수령'], ['gross', '실수령 → 청구할 세전']], 'net'),
      money('amount', '금액', '1,000,000'),
    ]),
    article: `
<h2>3.3%는 어떻게 나뉘나요</h2>
<p>회사가 프리랜서에게 돈을 줄 때 <strong>소득세 3%</strong>와 <strong>지방소득세 0.3%</strong>(소득세의 10%)를 떼고 대신 신고합니다.
예를 들어 100만원이면 소득세 ${won(withholding33(1_000_000).incomeTax)}, 지방소득세 ${won(withholding33(1_000_000).localTax)}를 떼고 <strong>${won(withholding33(1_000_000).net)}</strong>을 받습니다.</p>
<ul>
  <li>원 단위는 10원 미만을 버립니다.</li>
  <li>한 번에 떼는 소득세가 1,000원 미만이면 떼지 않습니다(소액부징수). 3만3천원 이하 지급이 여기에 해당합니다.</li>
</ul>
<h2>3.3%는 최종 세금이 아닙니다</h2>
<p>떼인 3.3%는 미리 낸 세금입니다. 다음 해 5월 종합소득세 신고에서 실제 세금을 계산해 <strong>더 냈으면 돌려받고, 덜 냈으면 추가로 냅니다</strong>.
연 수입이 크지 않은 프리랜서는 대부분 환급을 받습니다. <a href="../income-tax-refund/">종합소득세 환급 계산기</a>에서 예상 금액을 확인해 보세요.</p>`,
    faq: [
      ['견적을 낼 때 3.3%를 포함해야 하나요?', '실제로 손에 쥐고 싶은 금액이 있다면 "실수령 → 청구할 세전"으로 계산한 금액을 견적에 적으세요. 예: 200만원을 받으려면 약 206만 8천원을 청구해야 합니다.'],
      ['8.8%로 떼였는데 이건 뭔가요?', '강연료·원고료처럼 일시적인 소득은 기타소득으로 보아 필요경비 60%를 빼고 22%를 떼므로 지급액의 8.8%가 됩니다. 이 계산기는 사업소득(3.3%) 기준입니다.'],
    ],
    sources: [SRC.taxRate],
  },
  {
    slug: 'income-tax-refund',
    category: CATEGORY,
    icon: '💸',
    title: '종합소득세 환급 계산기 — 3.3% 프리랜서 5월 환급액 미리 계산',
    h1: '프리랜서 종합소득세 환급 계산기',
    short: '환급 예상',
    description:
      '3.3% 떼인 프리랜서가 5월 종합소득세 신고에서 얼마를 돌려받을지(또는 더 낼지) 계산합니다. 단순경비율·기준경비율 자동 판정, 2.8배 상한, 인적공제·자녀공제까지 반영합니다.',
    script: 'incomeTaxRefund',
    updated: '2026-10-20',
    body: calculator([
      money('revenue', '올해 프리랜서 총수입 (3.3% 떼기 전)', '20,000,000'),
      money('priorRevenue', '작년 총수입', '0', { hint: '작년 수입 3,600만원 미만이면 단순경비율을 적용합니다.' }),
      select(
        'industry',
        '업종',
        [...INDUSTRY_PRESETS.map((p) => [p.code, `${p.name} (${p.code})`]), ['custom', '직접 입력']],
        INDUSTRY_PRESETS[0].code,
      ),
      money('majorExpenses', '증빙 있는 주요경비 (기준경비율 적용 시)', '0', { hint: '사무실 임차료, 장비 구입비, 직원 인건비 등' }),
      `<details class="advanced"><summary>경비율·공제 자세히 입력</summary>`,
      number('simple', '단순경비율', INDUSTRY_PRESETS[0].simple * 100, '%', { step: 0.1 }),
      number('simpleOver', '단순경비율 (4천만원 초과분)', INDUSTRY_PRESETS[0].simpleOver * 100, '%', { step: 0.1 }),
      number('standard', '기준경비율', INDUSTRY_PRESETS[0].standard * 100, '%', { step: 0.1 }),
      number('dependents', '기본공제 인원 (본인 포함)', 1, '명', { step: 1, min: 1 }),
      number('children', '8세 이상 자녀 수', 0, '명', { step: 1 }),
      money('pensionPaid', '올해 낸 국민연금 (지역가입자)', '0'),
      money('otherDeductions', '노란우산공제 등 기타 소득공제', '0'),
      `</details>`,
    ]),
    article: `
<h2>계산 순서</h2>
<ol>
  <li><strong>사업소득금액</strong> = 수입 − 필요경비. 장부가 없으면 국세청이 정한 경비율로 경비를 인정합니다.</li>
  <li><strong>과세표준</strong> = 사업소득금액 − 인적공제(1명당 150만원) − 국민연금 − 기타 소득공제</li>
  <li><strong>산출세액</strong> = 과세표준 × 6~45% 누진세율</li>
  <li><strong>결정세액</strong> = 산출세액 − 자녀세액공제 − 표준세액공제(7만원), 여기에 지방소득세 10%</li>
  <li><strong>환급액</strong> = 이미 떼인 3.3% − (결정세액 + 지방소득세)</li>
</ol>
<h2>단순경비율과 기준경비율</h2>
<ul>
  <li><strong>단순경비율</strong>: 작년 수입 ${(SIMPLE_RATE_LIMITS.priorYear / 10_000).toLocaleString('ko-KR')}만원 미만이고 올해 수입 ${(SIMPLE_RATE_LIMITS.currentYear / 10_000).toLocaleString('ko-KR')}만원 미만인 인적용역 프리랜서. 수입의 60% 안팎을 경비로 인정해 세금이 적습니다(4천만원 초과분은 더 낮은 비율).</li>
  <li><strong>기준경비율</strong>: 그 밖의 경우. 증빙 있는 주요경비 + 수입 × 기준경비율(20% 안팎)만 인정되어 세금이 크게 늘 수 있습니다.
  다만 2027년 귀속까지는 단순경비율로 계산한 소득의 <strong>${STANDARD_MULTIPLIER.simpleBook}배</strong>(복식부기의무자 ${STANDARD_MULTIPLIER.doubleEntry}배)를 넘지 않습니다.</li>
</ul>
<p>경비율은 매년 국세청 고시로 조금씩 바뀝니다. 업종 목록의 값은 참고값이므로 홈택스에서 본인 업종코드의 올해 경비율을 확인해 고쳐 넣으세요.
실제 경비가 경비율보다 많다면 장부를 써서 신고하는 편이 유리할 수 있습니다.</p>
<h2>이 계산기가 다루지 않는 것</h2>
<p>근로소득·연금소득 등 다른 소득과의 합산, 의료비·교육비 등 특별세액공제(사업소득자는 대부분 대상 아님), 성실신고확인대상자, 공동사업은 반영하지 않습니다.</p>`,
    faq: [
      [
        '연 2,000만원 번 프리랜서는 얼마나 돌려받나요?',
        `일반 프리랜서(940909), 작년 수입 없음, 본인 1인 기준으로 3.3% ${won(sample.prepaid + sample.prepaidLocal)}를 떼였고 실제 세금은 ${won(sample.determined + sample.local)}이라 약 ${won(sample.refund)}을 돌려받습니다.`,
      ],
      ['환급은 언제 들어오나요?', '5월에 신고하면 보통 6월 말까지 신고한 계좌로 들어옵니다. 지난 5년 치 미신고분도 기한 후 신고나 경정청구로 돌려받을 수 있습니다.'],
      ['작년에 수입이 많았는데 올해 단순경비율을 못 쓰나요?', '네. 단순경비율 여부는 직전 연도 수입으로 정합니다. 작년 수입이 3,600만원 이상이면 올해는 기준경비율이나 장부로 신고해야 합니다.'],
    ],
    sources: [SRC.decree143, SRC.rule67, SRC.taxRate, SRC.hometaxRate],
  },
  {
    slug: 'dependent',
    category: CATEGORY,
    icon: '🛡️',
    title: '건강보험 피부양자 자격 계산기 — 프리랜서 소득 탈락 기준 2026',
    h1: '건강보험 피부양자 자격 확인',
    short: '피부양자',
    description:
      '프리랜서·N잡 소득이 생기면 가족의 건강보험 피부양자에서 탈락할까요? 사업소득 500만원, 합산소득 2,000만원, 재산 기준으로 자격 유지 여부와 남은 여유 소득을 확인합니다.',
    script: 'dependent',
    updated: '2026-10-20',
    body: calculator([
      segmented('registered', '사업자등록', [['no', '없음 (3.3% 프리랜서)'], ['yes', '있음']], 'no'),
      money('revenue', '연간 사업 수입 (3.3% 떼기 전)', '12,000,000'),
      number('expenseRate', '경비율', 64.1, '%', { step: 0.1, hint: '건강보험은 수입이 아닌 소득금액(수입 − 경비)으로 판단합니다. 일반 프리랜서 단순경비율 64.1%' }),
      money('wageIncome', '근로소득 (총급여)', '0'),
      money('pensionIncome', '연금소득 (공적연금)', '0'),
      money('financialIncome', '이자·배당 소득', '0', { hint: '연 1,000만원 이하면 합산하지 않습니다.' }),
      money('propertyBase', '재산세 과세표준 합계', '0'),
    ]),
    article: `
<h2>피부양자 소득 기준</h2>
${table(
  ['조건', '탈락 기준'],
  [
    ['사업자등록 있음', '사업소득금액이 1원이라도 있으면 탈락'],
    ['사업자등록 없음 (3.3% 프리랜서)', '사업소득금액 연 500만원 초과 시 탈락'],
    ['모든 소득 합산', '연 2,000만원 초과 시 탈락 (이자·배당은 1,000만원 초과일 때만 합산)'],
    ['재산', '재산세 과세표준 9억원 초과, 또는 5.4억원 초과이면서 소득 1,000만원 초과'],
  ],
)}
<p>여기서 사업소득은 <strong>수입이 아니라 경비를 뺀 소득금액</strong>입니다. 3.3% 프리랜서가 단순경비율 64.1%를 적용받으면 수입 약 1,392만원까지 소득금액 500만원 이하로 유지됩니다.</p>
<p>탈락하면 지역가입자로 바뀌어 건강보험료를 따로 내야 합니다. 국세청 소득 자료가 공단에 넘어가는 11월 무렵 자격이 다시 판정되는 경우가 많습니다.</p>
<p>근로소득 금액 표시는 단순화를 위해 총급여를 그대로 더합니다. 실제 공단 기준과 다를 수 있으니 최종 판정은 국민건강보험공단(1577-1000)에 확인하세요.</p>`,
    faq: [
      ['3.3% 프리랜서 수입이 얼마까지면 피부양자를 유지하나요?', '사업자등록이 없고 다른 소득이 없다면 사업소득금액 500만원까지입니다. 경비율 64.1%이면 수입 기준 약 1,392만원입니다.'],
      ['부모님이 연금을 받으시는데도 피부양자가 되나요?', '공적연금을 포함한 합산소득이 연 2,000만원 이하이고 재산 기준을 넘지 않으면 유지됩니다.'],
    ],
    sources: [SRC.nhisDependent],
  },
];
