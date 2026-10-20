import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { recordedYears, sortEntries, summarizeYear, toCsv, totalsByPayer } from '@/calc/ledger';
import { MoneyField, Segmented, TextField } from '@/components/Fields';
import { Notes, Paragraph, Result } from '@/components/Result';
import { Card, Screen } from '@/components/Screen';
import { won } from '@/format';
import { setPersistentValue, usePersistentState } from '@/storage/usePersistentState';
import { useTheme } from '@/theme';

type Entry = { id: string; date: string; payer: string; gross: number; kind: 'business' | 'other' };

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export default function LedgerScreen() {
  const t = useTheme();
  const [entries, setEntries] = usePersistentState<Entry[]>('ledger.entries', []);
  const [year, setYear] = useState(new Date().getFullYear());
  const [date, setDate] = useState(today());
  const [payer, setPayer] = useState('');
  const [gross, setGross] = useState(0);
  const [kind, setKind] = useState<Entry['kind']>('business');
  const [message, setMessage] = useState('');

  const years = [...new Set([new Date().getFullYear(), ...recordedYears(entries)])].sort((a, b) => b - a);
  const s = summarizeYear(entries, year);
  const list = sortEntries(entries).filter((e) => e.date.startsWith(`${year}-`));
  const canAdd = validDate(date) && gross > 0;
  const payers = totalsByPayer(entries, year);

  const add = () => {
    if (!canAdd) return;
    setEntries((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, date, payer: payer.trim() || '지급처 미입력', gross, kind }]);
    setYear(Number(date.slice(0, 4)));
    setGross(0);
    setPayer('');
    setMessage('');
  };
  const apply = () => {
    setPersistentValue('refund.revenue', s.business);
    setPersistentValue('dependent.revenue', s.business);
    setPersistentValue('eitc.businessRevenue', s.business);
    setPersistentValue('withholding.annualOther', s.other);
    setMessage(`${year}년 합계를 환급 예상·피부양자·근로장려금·기타소득 비교에 반영했습니다.`);
  };

  return (
    <Screen title="수입 기록" subtitle="지급받을 때마다 기록하면 연간 합계가 계산기에 자동으로 들어갑니다" underHeader>
      <Segmented label="연도" options={years.map((y) => [String(y), `${y}년`] as const)} value={String(year)} onChange={(v) => setYear(Number(v))} />
      <Result
        caption={`${year}년 받은 돈 (세전)`}
        headline={won(s.business + s.other)}
        note={`${s.count}건 · 통장에 들어온 금액 ${won(s.net)}`}
        rows={[
          { label: '사업소득 (3.3%)', value: won(s.business) },
          { label: '기타소득 (8.8%)', value: won(s.other) },
          { label: '떼인 소득세', value: won(s.withheldIncomeTax) },
          { label: '떼인 지방소득세', value: won(s.withheldLocalTax) },
        ]}
      />
      <Pressable role="button" onPress={apply} disabled={s.count === 0} style={[styles.apply, { backgroundColor: s.count ? t.accent : t.line }]}>
        <Text style={{ color: t.onAccent, fontWeight: '800' }}>이 합계를 계산기에 반영</Text>
      </Pressable>
      {message ? <Text style={{ color: t.good, fontSize: 13 }}>{message}</Text> : null}
      <Card>
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>새 기록</Text>
        <Segmented
          options={[
            ['business', '사업소득 3.3%'],
            ['other', '기타소득 8.8%'],
          ]}
          value={kind}
          onChange={setKind}
        />
        <MoneyField label="세전 지급액" value={gross} onChange={setGross} />
        <TextField label="지급처" value={payer} onChange={setPayer} placeholder="예: ○○출판사" />
        <TextField label="받은 날짜" value={date} onChange={setDate} placeholder="2026-10-21" hint={validDate(date) ? undefined : 'YYYY-MM-DD 형식으로 입력하세요.'} />
        <Pressable role="button" onPress={add} disabled={!canAdd} style={[styles.apply, { backgroundColor: canAdd ? t.accent : t.line }]}>
          <Text style={{ color: t.onAccent, fontWeight: '800' }}>기록 추가</Text>
        </Pressable>
      </Card>
      {list.map((e) => (
        <View key={e.id} style={[styles.row, { borderColor: t.line, backgroundColor: t.surface }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: t.text, fontWeight: '700' }}>{e.payer}</Text>
            <Text style={{ color: t.muted, fontSize: 12 }}>
              {e.date} · {e.kind === 'business' ? '3.3%' : '8.8%'}
            </Text>
          </View>
          <Text style={{ color: t.text, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{won(e.gross)}</Text>
          <Pressable role="button" aria-label={`${e.payer} ${e.date} 기록 삭제`} onPress={() => setEntries((prev) => prev.filter((x) => x.id !== e.id))} hitSlop={8}>
            <Text style={{ color: t.warn, fontWeight: '800', paddingHorizontal: 6 }}>✕</Text>
          </Pressable>
        </View>
      ))}
      {payers.length > 1 ? (
        <Card>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>지급처별 합계</Text>
          {payers.map((p) => (
            <View key={p.payer} style={styles.payerRow}>
              <Text style={{ color: t.text, flex: 1 }}>
                {p.payer} <Text style={{ color: t.muted }}>· {p.count}건</Text>
              </Text>
              <Text style={{ color: t.text, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{won(p.gross)}</Text>
            </View>
          ))}
        </Card>
      ) : null}
      {entries.length ? (
        <Pressable
          role="button"
          onPress={() => Share.share({ title: '프리셈 수입 기록', message: toCsv(entries) }).catch(() => {})}
          style={[styles.apply, { borderWidth: 1, borderColor: t.line, backgroundColor: t.surface }]}>
          <Text style={{ color: t.text, fontWeight: '700' }}>전체 기록 내보내기 (CSV)</Text>
        </Pressable>
      ) : null}
      <Notes>
        <Paragraph>기록은 이 기기에만 저장됩니다. 휴대폰을 바꾸기 전에 「전체 기록 내보내기」로 메일·메모·드라이브 등에 보관해 두세요. 원천징수 세액은 지급액으로 계산한 값이며, 실제 지급명세서는 홈택스 「지급명세서 등 제출내역」에서 확인할 수 있습니다.</Paragraph>
      </Notes>
    </Screen>
  );
}

const styles = StyleSheet.create({
  apply: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14 },
  payerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
