import { StyleSheet, Text, View } from 'react-native';
import { upcomingEvents } from '@/calc/schedule';
import { Notes, Paragraph } from '@/components/Result';
import { Card, Screen } from '@/components/Screen';
import { useTheme } from '@/theme';

const md = (d: Date) => `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;

export default function ScheduleScreen() {
  const t = useTheme();
  const events = upcomingEvents(new Date());
  return (
    <Screen title="세금 일정" subtitle="프리랜서·N잡러가 챙겨야 할 신고·납부 기간">
      {events.map((e) => (
        <Card key={e.id}>
          <View style={styles.row}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.title, { color: t.text }]}>{e.title}</Text>
              <Text style={{ color: t.muted, fontSize: 13 }}>
                {e.start.getUTCFullYear()}년 {md(e.start)} ~ {md(e.end)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: e.ongoing ? t.accent : t.accentSoft }]}>
              <Text style={{ color: e.ongoing ? t.onAccent : t.accent, fontWeight: '800' }}>
                {e.ongoing ? `마감 D-${e.days}` : `D-${e.days}`}
              </Text>
            </View>
          </View>
          <Text style={{ color: t.muted, fontSize: 13, lineHeight: 19 }}>{e.description}</Text>
        </Card>
      ))}
      <Notes>
        <Paragraph>마감일이 주말·공휴일이면 다음 영업일로 미뤄집니다. 정확한 기한은 홈택스 공지와 고지서를 확인하세요.</Paragraph>
      </Notes>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
});
