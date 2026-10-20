import { grossFromNet, withholding33 } from '@/calc/freelancer';
import { MoneyField, Segmented } from '@/components/Fields';
import { Notes, Paragraph, Result } from '@/components/Result';
import { Card, Screen } from '@/components/Screen';
import { usePersistentState } from '@/storage/usePersistentState';
import { won } from '@/format';

export default function WithholdingScreen() {
  const [mode, setMode] = usePersistentState<'net' | 'gross'>('withholding.mode', 'net');
  const [amount, setAmount] = usePersistentState('withholding.amount', 1_000_000);
  const toNet = mode === 'net';
  const r = toNet ? withholding33(amount) : grossFromNet(amount);

  return (
    <Screen title="3.3% 계산" subtitle="프리랜서 사업소득 원천징수(소득세 3% + 지방소득세 0.3%)">
      <Card>
        <Segmented
          options={[
            ['net', '세전 → 실수령'],
            ['gross', '실수령 → 청구할 세전'],
          ]}
          value={mode}
          onChange={setMode}
        />
        <MoneyField label={toNet ? '세전 금액 (계약 금액)' : '받고 싶은 실수령액'} value={amount} onChange={setAmount} />
      </Card>
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
      <Notes>
        <Paragraph>
          10원 미만은 버리며, 한 번에 떼는 소득세가 1,000원 미만이면 떼지 않습니다(소액부징수). 떼인 3.3%는 미리 낸 세금이라 5월 종합소득세 신고 때 정산됩니다. 강연료·원고료 같은
          일시적 기타소득은 8.8%가 적용되므로 이 계산과 다릅니다.
        </Paragraph>
      </Notes>
    </Screen>
  );
}
