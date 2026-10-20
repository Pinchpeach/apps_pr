import { calcEitc, HOUSEHOLD, PROPERTY_HALF, PROPERTY_LIMIT } from '@/calc/eitc';
import { MoneyField, Segmented, Toggle } from '@/components/Fields';
import { Notes, Paragraph, Result, type Row } from '@/components/Result';
import { Card, Screen } from '@/components/Screen';
import { usePersistentState } from '@/storage/usePersistentState';
import { won } from '@/format';

type Household = keyof typeof HOUSEHOLD;

export default function EitcScreen() {
  const [type, setType] = usePersistentState<Household>('eitc.type', 'single');
  const [businessRevenue, setBusinessRevenue] = usePersistentState('eitc.businessRevenue', 12_000_000);
  const [wage, setWage] = usePersistentState('eitc.wage', 0);
  const [spouseEarnings, setSpouseEarnings] = usePersistentState('eitc.spouseEarnings', 0);
  const [otherIncome, setOtherIncome] = usePersistentState('eitc.otherIncome', 0);
  const [property, setProperty] = usePersistentState('eitc.property', 50_000_000);
  const [late, setLate] = usePersistentState('eitc.late', false);

  const r = calcEitc({ type, businessRevenue, wage, spouseEarnings, otherIncome, property, late });
  const rows: Row[] = [
    { label: '내 총급여액 등', value: won(r.ownEarnings) },
    { label: '가구 총급여액 등', value: won(r.earnings) },
    { label: '가구 연간 총소득', value: won(r.totalIncome) },
  ];
  if (r.eligible) {
    rows.push({ label: '산정액', value: won(r.base) });
    if (property >= PROPERTY_HALF) rows.push({ label: '재산 1억 7천만원 이상 50% 감액', value: '적용', tone: 'warn' });
    if (late) rows.push({ label: '기한 후 신청 95%', value: '적용', tone: 'warn' });
  }
  r.reasons.slice(1).forEach((reason) => rows.push({ label: '추가 사유', value: reason, tone: 'warn' }));

  return (
    <Screen title="근로장려금" subtitle="소득이 적은 프리랜서·근로자 가구가 5월에 신청하면 받는 장려금" underHeader>
      <Result
        caption={r.eligible ? '받을 수 있는 예상 금액' : '판정'}
        headline={r.eligible ? won(r.amount) : '대상 아님'}
        tone={r.eligible ? 'good' : 'warn'}
        note={r.eligible ? `${HOUSEHOLD[type].label} 기준 · 5월 정기 신청 시 9월 지급` : r.reasons[0]}
        rows={rows}
      />
      <Card>
        <Segmented
          label="가구 유형"
          options={[
            ['single', '단독'],
            ['oneEarner', '홑벌이'],
            ['twoEarner', '맞벌이'],
          ]}
          value={type}
          onChange={setType}
        />
        <MoneyField label="내 3.3% 프리랜서 수입 (세전)" value={businessRevenue} onChange={setBusinessRevenue} hint="인적용역은 수입의 90%를 소득으로 봅니다." />
        <MoneyField label="내 근로소득 (총급여)" value={wage} onChange={setWage} />
        {type !== 'single' ? (
          <MoneyField label="배우자 총급여액 등" value={spouseEarnings} onChange={setSpouseEarnings} hint="배우자 근로소득 + 사업수입 × 조정률. 300만원 이상이면 맞벌이" />
        ) : null}
        <MoneyField label="이자·배당·연금·기타소득 (가구 합계)" value={otherIncome} onChange={setOtherIncome} />
        <MoneyField
          label="가구원 재산 합계 (6월 1일 기준)"
          value={property}
          onChange={setProperty}
          hint={`집·토지(시가표준액), 전세보증금, 예금, 자동차 등. ${(PROPERTY_LIMIT / 100_000_000).toFixed(1)}억원 이상이면 대상 아님`}
        />
        <Toggle label="5월이 지나 기한 후 신청 (6~11월, 95% 지급)" value={late} onChange={setLate} />
      </Card>
      <Notes sources={[['조세특례제한법 제100조의3·제100조의5 (근로장려금)', 'https://www.law.go.kr/법령/조세특례제한법']]}>
        <Paragraph>
          단독가구는 배우자·부양자녀·70세 이상 부양 부모가 없는 가구, 홑벌이는 배우자 총급여액 등이 300만원 미만이거나 부양자녀·부모가 있는 가구, 맞벌이는 부부 각각 300만원 이상인
          가구입니다. 가구 총소득이 단독 2,200만원·홑벌이 3,200만원·맞벌이 4,400만원 미만이고 재산이 2억 4천만원 미만이어야 합니다. 최종 금액은 국세청 심사로 정해집니다.
        </Paragraph>
      </Notes>
    </Screen>
  );
}
