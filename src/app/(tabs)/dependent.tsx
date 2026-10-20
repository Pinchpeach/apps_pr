import { checkDependent } from '@/calc/freelancer';
import { calcRegionalPremium } from '@/calc/nhi';
import { Collapsible, MoneyField, NumberField, Segmented } from '@/components/Fields';
import { Notes, Paragraph, Result, type Row } from '@/components/Result';
import { Card, Screen } from '@/components/Screen';
import { usePersistentState } from '@/storage/usePersistentState';
import { won } from '@/format';

export default function DependentScreen() {
  const [registered, setRegistered] = usePersistentState<'no' | 'yes'>('dependent.registered', 'no');
  const [revenue, setRevenue] = usePersistentState('dependent.revenue', 12_000_000);
  const [expenseRate, setExpenseRate] = usePersistentState('dependent.expenseRate', 64.1);
  const [wageIncome, setWageIncome] = usePersistentState('dependent.wageIncome', 0);
  const [pensionIncome, setPensionIncome] = usePersistentState('dependent.pensionIncome', 0);
  const [financialIncome, setFinancialIncome] = usePersistentState('dependent.financialIncome', 0);
  const [propertyBase, setPropertyBase] = usePersistentState('dependent.propertyBase', 0);
  const [leaseDeposit, setLeaseDeposit] = usePersistentState('dependent.leaseDeposit', 0);
  const [leaseMonthly, setLeaseMonthly] = usePersistentState('dependent.leaseMonthly', 0);

  const businessIncome = Math.floor(revenue * (1 - expenseRate / 100));
  const r = checkDependent({ businessIncome, registered: registered === 'yes', wageIncome, pensionIncome, financialIncome, propertyBase });
  const premium = calcRegionalPremium({
    business: businessIncome,
    wage: wageIncome,
    pension: pensionIncome,
    interestDividend: financialIncome,
    propertyBase,
    leaseDeposit: propertyBase > 0 ? 0 : leaseDeposit,
    leaseMonthly: propertyBase > 0 ? 0 : leaseMonthly,
  });
  const rows: Row[] = [
    { label: '사업소득금액 (수입 − 경비)', value: won(businessIncome) },
    { label: '합산소득', value: won(r.total) },
    ...r.reasons.slice(1).map((reason): Row => ({ label: '추가 사유', value: reason, tone: 'warn' })),
  ];

  return (
    <Screen title="피부양자 자격" subtitle="부업·프리랜서 소득이 생겨도 가족 건강보험 피부양자로 남을 수 있는지 확인">
      <Result
        caption="판정"
        headline={r.eligible ? '유지 가능' : '탈락 예상'}
        tone={r.eligible ? 'good' : 'warn'}
        note={
          r.eligible
            ? registered === 'yes'
              ? '사업자등록이 있으면 사업소득이 생기는 순간 탈락합니다.'
              : `소득금액 기준 ${won(r.headroom)} 더 벌어도 유지됩니다.`
            : r.reasons[0]
        }
        rows={rows}
      />
      <Result
        caption={r.eligible ? '탈락한다면 내야 할 건강보험료 (월)' : '지역가입자 건강보험료 예상 (월)'}
        headline={won(premium.total)}
        tone={r.eligible ? 'accent' : 'warn'}
        note="올해 소득은 다음 해 11월부터 보험료에 반영됩니다."
        rows={[
          { label: '소득월액 (근로·연금은 50%)', value: won(premium.incomeMonthly) },
          { label: '소득 보험료 (7.19%)', value: won(premium.incomePremium) },
          { label: `재산 보험료 (${premium.points.toLocaleString('ko-KR')}점 × 211.5원)`, value: won(premium.propertyPremium) },
          { label: '장기요양보험료 (13.14%)', value: won(premium.longTermCare) },
          { label: '월 합계', value: won(premium.total), tone: 'total' },
        ]}
      />
      <Card>
        <Segmented
          label="사업자등록"
          options={[
            ['no', '없음 (3.3% 프리랜서)'],
            ['yes', '있음'],
          ]}
          value={registered}
          onChange={setRegistered}
        />
        <MoneyField label="연간 사업 수입 (3.3% 떼기 전)" value={revenue} onChange={setRevenue} />
        <NumberField label="경비율" unit="%" decimal value={expenseRate} onChange={setExpenseRate} hint="건강보험은 수입이 아니라 경비를 뺀 소득금액으로 판단합니다. 일반 프리랜서 단순경비율 64.1%" />
        <Collapsible title="다른 소득·재산 입력">
          <MoneyField label="근로소득 (총급여)" value={wageIncome} onChange={setWageIncome} />
          <MoneyField label="연금소득 (공적연금)" value={pensionIncome} onChange={setPensionIncome} />
          <MoneyField label="이자·배당 소득" value={financialIncome} onChange={setFinancialIncome} hint="연 1,000만원 이하면 합산하지 않습니다." />
          <MoneyField label="재산세 과세표준 합계" value={propertyBase} onChange={setPropertyBase} hint="집·토지 등. 공시가격의 약 60% 수준" />
          <MoneyField label="전월세 보증금 (집이 없을 때)" value={leaseDeposit} onChange={setLeaseDeposit} />
          <MoneyField label="월세" value={leaseMonthly} onChange={setLeaseMonthly} hint="(보증금 + 월세 × 40) × 30%를 재산으로 봅니다." />
        </Collapsible>
      </Card>
      <Notes sources={[['국민건강보험공단 — 피부양자 자격 기준', 'https://www.nhis.or.kr']]}>
        <Paragraph>
          사업자등록이 없으면 사업소득금액 연 500만원, 모든 소득 합산 연 2,000만원(이자·배당은 1,000만원 초과일 때만 합산)을 넘으면 탈락합니다. 재산세 과세표준 9억원 초과, 또는 5.4억원
          초과이면서 소득 1,000만원 초과여도 탈락합니다. 지역가입자 보험료는 소득(7.19%)과 재산(1억원 공제 후 등급 점수 × 211.5원)으로 정해지며, 소득월액 28만원 이하면 최저 20,160원입니다. 최종 판정과 보험료는 공단(1577-1000)에 확인하세요.
        </Paragraph>
      </Notes>
    </Screen>
  );
}
