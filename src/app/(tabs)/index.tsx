import { calcIncomeTaxRefund, SIMPLE_RATE_LIMITS } from '@/calc/freelancer';
import { Collapsible, MoneyField, NumberField } from '@/components/Fields';
import { METHOD_LABEL, useIndustry } from '@/components/Industry';
import { Notes, Paragraph, Result } from '@/components/Result';
import { Card, Screen } from '@/components/Screen';
import { usePersistentState } from '@/storage/usePersistentState';
import { signedWon, won } from '@/format';

const SOURCES: [string, string][] = [
  ['소득세법 시행령 제143조 (추계결정)', 'https://www.law.go.kr/법령/소득세법시행령/제143조'],
  ['소득세법 시행규칙 제67조 (배율)', 'https://www.law.go.kr/법령/소득세법시행규칙/제67조'],
];

export default function RefundScreen() {
  const [revenue, setRevenue] = usePersistentState('refund.revenue', 20_000_000);
  const [priorRevenue, setPriorRevenue] = usePersistentState('refund.priorRevenue', 0);
  const [majorExpenses, setMajorExpenses] = usePersistentState('refund.majorExpenses', 0);
  const [dependents, setDependents] = usePersistentState('refund.dependents', 1);
  const [children, setChildren] = usePersistentState('refund.children', 0);
  const [pensionPaid, setPensionPaid] = usePersistentState('refund.pensionPaid', 0);
  const [otherDeductions, setOtherDeductions] = usePersistentState('refund.otherDeductions', 0);
  const { rates, picker } = useIndustry('refund');

  const r = calcIncomeTaxRefund({ revenue, priorRevenue, rates, majorExpenses, dependents, children, pensionPaid, otherDeductions });
  const refund = r.refund >= 0;

  return (
    <Screen title="5월 종소세 환급 예상" subtitle="3.3% 떼인 프리랜서가 5월 종합소득세 신고 때 돌려받을(또는 더 낼) 금액">
      <Result
        caption={refund ? '돌려받을 예상 금액' : '추가로 낼 예상 금액'}
        headline={signedWon(r.refund)}
        tone={refund ? 'accent' : 'warn'}
        note={`${METHOD_LABEL[r.method]} 적용`}
        rows={[
          { label: '사업소득금액', value: won(r.income) },
          { label: '소득공제', value: `-${won(r.deductions)}` },
          { label: '과세표준', value: won(r.taxBase) },
          { label: '산출세액', value: won(r.computed) },
          { label: '세액공제', value: `-${won(r.credits)}` },
          { label: '낼 세금 (지방세 포함)', value: won(r.determined + r.local), tone: 'sum' },
          { label: '이미 떼인 3.3%', value: won(r.prepaid + r.prepaidLocal) },
        ]}
      />
      <Card>
        <MoneyField label="올해 프리랜서 총수입 (3.3% 떼기 전)" value={revenue} onChange={setRevenue} />
        <MoneyField
          label="작년 총수입"
          value={priorRevenue}
          onChange={setPriorRevenue}
          hint={`작년 수입이 ${(SIMPLE_RATE_LIMITS.priorYear / 10_000).toLocaleString('ko-KR')}만원 미만이면 단순경비율을 씁니다.`}
        />
        {picker}
        {r.method !== 'simple' ? (
          <MoneyField label="증빙 있는 주요경비" value={majorExpenses} onChange={setMajorExpenses} hint="사무실 임차료, 장비 구입비, 직원 인건비 등" />
        ) : null}
        <Collapsible title="공제 입력 (가족·국민연금·노란우산)">
          <NumberField label="기본공제 인원 (본인 포함)" unit="명" value={dependents} onChange={(v) => setDependents(Math.max(1, v))} />
          <NumberField label="8세 이상 자녀 수" unit="명" value={children} onChange={setChildren} />
          <MoneyField label="올해 낸 국민연금 (지역가입자)" value={pensionPaid} onChange={setPensionPaid} />
          <MoneyField label="노란우산공제 등 기타 소득공제" value={otherDeductions} onChange={setOtherDeductions} />
        </Collapsible>
      </Card>
      <Notes sources={SOURCES}>
        <Paragraph>
          장부 없이 신고하면 국세청 경비율로 경비를 인정합니다. 작년 수입 3,600만원 미만·올해 7,500만원 미만이면 단순경비율(수입의 약 60%를 경비로 인정), 그 밖에는
          기준경비율이 적용되며 단순경비율 소득의 2.8배(복식부기의무자 3.4배)를 넘지 않습니다.
        </Paragraph>
      </Notes>
    </Screen>
  );
}
