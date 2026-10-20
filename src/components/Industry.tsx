import { useState } from 'react';
import { INDUSTRY_PRESETS } from '@/calc/freelancer';
import { Collapsible, NumberField, Segmented } from './Fields';

export type Rates = { simple: number; simpleOver: number; standard: number };

const asPercent = (r: number) => Number((r * 100).toFixed(1));

/** 업종 선택 + 경비율(참고값, 직접 수정 가능) */
export function useIndustry() {
  const [code, setCode] = useState<string>(INDUSTRY_PRESETS[0].code);
  const [rates, setRates] = useState<Rates>({ ...INDUSTRY_PRESETS[0] });
  const choose = (next: string) => {
    setCode(next);
    const preset = INDUSTRY_PRESETS.find((p) => p.code === next);
    if (preset) setRates({ simple: preset.simple, simpleOver: preset.simpleOver, standard: preset.standard });
  };
  const edit = (key: keyof Rates) => (pct: number) => {
    setCode('custom');
    setRates((prev) => ({ ...prev, [key]: pct / 100 }));
  };
  const picker = (
    <>
      <Segmented
        label="업종"
        options={[...INDUSTRY_PRESETS.map((p) => [p.code, p.name] as const), ['custom', '직접 입력'] as const]}
        value={code}
        onChange={choose}
      />
      <Collapsible title="경비율 확인·수정 (매년 국세청 고시로 바뀌는 참고값)">
        <NumberField label="단순경비율" unit="%" decimal value={asPercent(rates.simple)} onChange={edit('simple')} />
        <NumberField label="단순경비율 (4천만원 초과분)" unit="%" decimal value={asPercent(rates.simpleOver)} onChange={edit('simpleOver')} />
        <NumberField
          label="기준경비율"
          unit="%"
          decimal
          value={asPercent(rates.standard)}
          onChange={edit('standard')}
          hint="홈택스 → 세금신고 → 종합소득세 → 기준·단순경비율(업종코드) 조회에서 올해 값을 확인하세요."
        />
      </Collapsible>
    </>
  );
  return { rates, picker };
}

export const METHOD_LABEL: Record<string, string> = {
  simple: '단순경비율',
  standard: '기준경비율 (2.8배 상한)',
  standardDouble: '기준경비율 (복식부기, 3.4배 상한)',
};
