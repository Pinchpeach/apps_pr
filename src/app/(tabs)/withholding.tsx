import { compareOtherIncomeTaxation, grossFromNet, otherIncomeWithholding, withholding33 } from '@/calc/freelancer';
import { MoneyField, Segmented } from '@/components/Fields';
import { Notes, Paragraph, Result } from '@/components/Result';
import { Card, Screen } from '@/components/Screen';
import { usePersistentState } from '@/storage/usePersistentState';
import { won } from '@/format';

export default function WithholdingScreen() {
  const [kind, setKind] = usePersistentState<'business' | 'other'>('withholding.kind', 'business');
  const [mode, setMode] = usePersistentState<'net' | 'gross'>('withholding.mode', 'net');
  const [amount, setAmount] = usePersistentState('withholding.amount', 1_000_000);
  const [annualOther, setAnnualOther] = usePersistentState('withholding.annualOther', 5_000_000);
  const [otherTaxBase, setOtherTaxBase] = usePersistentState('withholding.otherTaxBase', 0);

  return (
    <Screen title="원천징수 계산" subtitle="사업소득 3.3%(계속적인 일)와 기타소득 8.8%(강연료·원고료 같은 일시적인 일)">
      <Card>
        <Segmented
          label="어떤 소득인가요?"
          options={[
            ['business', '사업소득 3.3%'],
            ['other', '기타소득 8.8%'],
          ]}
          value={kind}
          onChange={setKind}
        />
        {kind === 'business' ? (
          <Segmented
            options={[
              ['net', '세전 → 실수령'],
              ['gross', '실수령 → 청구할 세전'],
            ]}
            value={mode}
            onChange={setMode}
          />
        ) : null}
        <MoneyField label={kind === 'business' && mode === 'gross' ? '받고 싶은 실수령액' : '세전 금액 (지급액)'} value={amount} onChange={setAmount} />
      </Card>
      {kind === 'business' ? <Business amount={amount} toNet={mode === 'net'} /> : <Other amount={amount} />}
      {kind === 'other' ? (
        <>
          <Card>
            <MoneyField label="올해 기타소득 지급액 합계" value={annualOther} onChange={setAnnualOther} hint="강연료·원고료 등 8.8% 떼인 금액의 연간 합계 (세전)" />
            <MoneyField label="다른 종합소득 과세표준" value={otherTaxBase} onChange={setOtherTaxBase} hint="직장인은 원천징수영수증의 과세표준, 다른 소득이 없으면 0" />
          </Card>
          <Compare annualGross={annualOther} otherTaxBase={otherTaxBase} />
        </>
      ) : null}
      <Notes>
        <Paragraph>
          {kind === 'business'
            ? '10원 미만은 버리며, 한 번에 떼는 소득세가 1,000원 미만이면 떼지 않습니다(소액부징수). 떼인 3.3%는 미리 낸 세금이라 5월 종합소득세 신고 때 정산됩니다.'
            : '강연료·원고료처럼 일시적인 소득은 지급액의 60%를 경비로 인정하고 나머지(기타소득금액)에 20%와 지방소득세 2%를 떼어 지급액의 8.8%가 됩니다. 건별 기타소득금액이 5만원(지급액 12만 5천원) 이하면 세금이 없습니다.'}
        </Paragraph>
      </Notes>
    </Screen>
  );
}

function Business({ amount, toNet }: { amount: number; toNet: boolean }) {
  const r = toNet ? withholding33(amount) : grossFromNet(amount);
  return (
    <Result
      caption={toNet ? '통장에 들어오는 금액' : '견적·계약서에 적을 세전 금액'}
      headline={won(toNet ? r.net : r.gross)}
      rows={[
        { label: '세전 금액', value: won(r.gross) },
        { label: '소득세 3%', value: `-${won(r.incomeTax)}` },
        { label: '지방소득세 0.3%', value: `-${won(r.localTax)}` },
        { label: '실수령액', value: won(r.net), tone: 'total' },
      ]}
    />
  );
}

function Other({ amount }: { amount: number }) {
  const r = otherIncomeWithholding(amount);
  return (
    <Result
      caption="통장에 들어오는 금액"
      headline={won(r.net)}
      note={r.exempt ? '기타소득금액 5만원 이하 — 과세최저한으로 세금이 없습니다.' : undefined}
      rows={[
        { label: '지급액', value: won(r.gross) },
        { label: '기타소득금액 (경비 60% 제외)', value: won(r.incomeAmount) },
        { label: '소득세 20%', value: `-${won(r.incomeTax)}` },
        { label: '지방소득세 2%', value: `-${won(r.localTax)}` },
        { label: '실수령액', value: won(r.net), tone: 'total' },
      ]}
    />
  );
}

function Compare({ annualGross, otherTaxBase }: { annualGross: number; otherTaxBase: number }) {
  const c = compareOtherIncomeTaxation({ annualGross, otherTaxBase });
  const separateTotal = c.separate.tax + c.separate.local;
  const combinedTotal = c.combined.tax + c.combined.local;
  return (
    <Result
      caption="5월에 어떻게 신고할까?"
      headline={!c.canSeparate ? '종합과세 의무' : c.better === 'combined' ? '종합과세가 유리' : '분리과세가 유리'}
      tone={c.better === 'combined' && c.canSeparate ? 'good' : 'accent'}
      note={
        !c.canSeparate
          ? '기타소득금액이 300만원을 넘으면 다른 소득과 합쳐 신고해야 합니다.'
          : c.better === 'combined'
            ? `합쳐서 신고하면 떼인 세금 중 약 ${won(c.saving)}을 돌려받습니다.`
            : '떼인 8.8%로 끝내면(신고 안 함) 됩니다.'
      }
      rows={[
        { label: '연간 기타소득금액', value: won(c.incomeAmount) },
        { label: '분리과세 세금 (22%)', value: won(separateTotal) },
        { label: '종합과세 시 늘어나는 세금', value: won(combinedTotal) },
      ]}
    />
  );
}
