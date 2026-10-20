import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

export type Row = { label: string; value: string; tone?: 'total' | 'warn' | 'sum' };

/** 큰 결과 + 항목별 내역 */
export function Result({ caption, headline, tone = 'accent', note, rows }: { caption: string; headline: string; tone?: 'accent' | 'warn' | 'good'; note?: string; rows: Row[] }) {
  const t = useTheme();
  const color = tone === 'warn' ? t.warn : tone === 'good' ? t.good : t.accent;
  return (
    <View style={[styles.box, { backgroundColor: t.surface, borderColor: color }]} accessibilityLiveRegion="polite">
      <Text style={[styles.caption, { color: t.muted }]}>{caption}</Text>
      <Text style={[styles.headline, { color }]} accessibilityRole="header">
        {headline}
      </Text>
      {note ? <Text style={[styles.note, { color: t.muted }]}>{note}</Text> : null}
      <View style={{ marginTop: 6 }}>
        {rows.map((row) => (
          <View key={row.label} style={[styles.row, { borderTopColor: t.line }]}>
            <Text style={[styles.rowLabel, { color: row.tone === 'total' ? t.text : t.muted, fontWeight: row.tone ? '700' : '400' }]}>{row.label}</Text>
            <Text
              style={[
                styles.rowValue,
                { color: row.tone === 'warn' ? t.warn : t.text, fontWeight: row.tone === 'total' ? '800' : row.tone ? '700' : '500' },
              ]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
      <Pressable
        role="button"
        onPress={() => Share.share({ message: shareText(caption, headline, note, rows) }).catch(() => {})}
        style={[styles.share, { borderColor: t.line }]}>
        <Text style={{ color: t.text, fontWeight: '700' }}>결과 공유</Text>
      </Pressable>
    </View>
  );
}

function shareText(caption: string, headline: string, note: string | undefined, rows: Row[]) {
  return [`[프리셈] ${caption}: ${headline}`, note, ...rows.map((r) => `· ${r.label}: ${r.value}`), '※ 법령 기준 추정치입니다.']
    .filter(Boolean)
    .join('\n');
}

/** 계산 근거·면책 */
export function Notes({ children, sources = [] }: { children?: ReactNode; sources?: [string, string][] }) {
  const t = useTheme();
  return (
    <View style={styles.notes}>
      {children}
      {sources.map(([label, url]) => (
        <Text key={url} style={[styles.link, { color: t.accent }]} accessibilityRole="link" onPress={() => Linking.openURL(url)}>
          {label} ↗
        </Text>
      ))}
      <Link href="/about" style={[styles.link, { color: t.accent }]}>
        앱 정보 · 개인정보처리방침 · 입력값 초기화
      </Link>
      <Text style={[styles.small, { color: t.muted }]}>
        계산 결과는 공개된 법령·고시에 따른 추정치이며 법적 효력이 없습니다. 입력한 숫자는 이 기기에서만 계산되고 어디로도 전송되지 않습니다.
      </Text>
    </View>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.paragraph, { color: t.muted }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  box: { borderWidth: 2, borderRadius: 20, padding: 18 },
  caption: { fontSize: 13, fontWeight: '600' },
  headline: { fontSize: 32, fontWeight: '800', marginTop: 2, fontVariant: ['tabular-nums'] },
  note: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth },
  rowLabel: { fontSize: 14, flexShrink: 1 },
  rowValue: { fontSize: 14, textAlign: 'right', fontVariant: ['tabular-nums'], flexShrink: 1 },
  notes: { gap: 8, paddingHorizontal: 4 },
  paragraph: { fontSize: 13, lineHeight: 20 },
  link: { fontSize: 13, fontWeight: '600' },
  small: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  share: { marginTop: 12, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
});
