import { calcNjobTax } from '@/calc/freelancer';
import { MoneyField } from '@/components/Fields';
import { METHOD_LABEL, useIndustry } from '@/components/Industry';
import { Notes, Paragraph, Result } from '@/components/Result';
import { Card, Screen } from '@/components/Screen';
import { usePersistentState } from '@/storage/usePersistentState';
import { signedWon, won } from '@/format';

export default function NjobScreen() {
  const [totalWage, setTotalWage] = usePersistentState('njob.totalWage', 50_000_000);
  const [wageTaxBase, setWageTaxBase] = usePersistentState('njob.wageTaxBase', 30_000_000);
  const [wageDetermined, setWageDetermined] = usePersistentState('njob.wageDetermined', 1_500_000);
  const [revenue, setRevenue] = usePersistentState('njob.revenue', 10_000_000);
  const [priorRevenue, setPriorRevenue] = usePersistentState('njob.priorRevenue', 0);
  const [majorExpenses, setMajorExpenses] = usePersistentState('njob.majorExpenses', 0);
  const { rates, picker } = useIndustry('njob');

  const r = calcNjobTax({ totalWage, wageTaxBase, wageDetermined, revenue, priorRevenue, rates, majorExpenses });
  const refund = r.refund >= 0;
  const sideWithheld = r.prepaid - wageDetermined + r.prepaidLocal - Math.floor((wageDetermined * 0.1) / 10) * 10;

  return (
    <Screen title="N잡 직장인 세금" subtitle="월급 + 3.3% 부업을 합쳐 5월에 신고할 때 더 낼(또는 돌려받을) 금액">
      <Result
        caption={refund ? '돌려받을 예상 금액' : '추가로 낼 예상 금액'}
        headline={signedWon(r.refund)}
        tone={refund ? 'accent' : 'warn'}
        note={`부업 ${METHOD_LABEL[r.method]} 적용`}
        rows={[
          { label: '부업 사업소득금액', value: won(r.businessIncome) },
          { label: '합산 과세표준', value: won(r.taxBase) },
          { label: '부업 때문에 늘어난 세금', value: won(r.extraTax), tone: 'sum' },
          { label: '부업에서 떼인 3.3%', value: won(sideWithheld) },
        ]}
      />
      <Card>
        <MoneyField label="총급여 (원천징수영수증)" value={totalWage} onChange={setTotalWage} />
        <MoneyField label="종합소득 과세표준" value={wageTaxBase} onChange={setWageTaxBase} hint="원천징수영수증 「종합소득 과세표준」 칸" />
        <MoneyField label="결정세액 — 소득세" value={wageDetermined} onChange={setWageDetermined} hint="「결정세액」의 소득세 칸 (지방소득세 제외)" />
      </Card>
      <Card>
        <MoneyField label="부업 총수입 (3.3% 떼기 전)" value={revenue} onChange={setRevenue} />
        <MoneyField label="작년 부업 총수입" value={priorRevenue} onChange={setPriorRevenue} />
        {picker}
        {r.method !== 'simple' ? <MoneyField label="증빙 있는 주요경비" value={majorExpenses} onChange={setMajorExpenses} /> : null}
      </Card>
      <Notes sources={[['소득세법 제47조·제59조 (근로소득공제·세액공제)', 'https://www.law.go.kr/법령/소득세법']]}>
        <Paragraph>
          회사는 월급만 보고 연말정산을 합니다. 부업 소득을 합치면 월급 위에 얹힌 높은 세율이 부업 소득에 붙어 5월에 차액을 더 내는 경우가 많습니다. 근로소득세액공제는 근로소득 비율만큼
          다시 계산하고, 연말정산 때 받은 나머지 세액공제는 그대로 둡니다. 원천징수영수증은 홈택스 또는 회사 인사팀에서 받을 수 있습니다.
        </Paragraph>
      </Notes>
    </Screen>
  );
}
