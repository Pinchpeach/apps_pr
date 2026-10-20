import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { upcomingEvents } from '@/calc/schedule';
import { Toggle } from '@/components/Fields';
import { Notes, Paragraph } from '@/components/Result';
import { cancelReminders, remindersSupported, scheduleReminders } from '@/notify/reminders';
import { usePersistentState } from '@/storage/usePersistentState';
import { Card, Screen } from '@/components/Screen';
import { LinkCard } from '@/components/LinkCard';
import { useTheme } from '@/theme';

const md = (d: Date) => `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;

export default function ScheduleScreen() {
  const t = useTheme();
  const events = upcomingEvents(new Date());
  const [enabled, setEnabled] = usePersistentState('schedule.reminders', false);
  const [status, setStatus] = useState('');

  // 알림을 켜 둔 상태면 화면을 처음 열 때 다음 일정으로 다시 예약한다(토글로 켠 직후에는 중복 예약하지 않음).
  const enabledAtMount = useRef(enabled);
  useEffect(() => {
    if (enabledAtMount.current) scheduleReminders().catch(() => {});
  }, []);

  const toggle = async (next: boolean) => {
    if (!next) {
      setEnabled(false);
      await cancelReminders();
      setStatus('알림을 껐습니다.');
      return;
    }
    const count = await scheduleReminders().catch(() => null);
    if (count === null) {
      setStatus('알림 권한이 없어 켜지 못했습니다. 기기 설정에서 알림을 허용해 주세요.');
      return;
    }
    setEnabled(true);
    setStatus(`다음 일정 알림 ${count}개를 예약했습니다. 시작일과 마감 3일 전 오전 9시에 알려 드려요.`);
  };

  return (
    <Screen title="세금 일정" subtitle="프리랜서·N잡러가 챙겨야 할 신고·납부 기간">
      {remindersSupported ? (
        <Card>
          <Toggle label="마감 알림 받기 (시작일·마감 3일 전 오전 9시)" value={enabled} onChange={toggle} />
          {status ? <Text style={{ color: t.muted, fontSize: 13 }}>{status}</Text> : null}
        </Card>
      ) : null}
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
      <LinkCard href="/eitc" title="근로장려금 예상액 계산" body="5월 정기 신청 전에 우리 가구가 대상인지, 얼마를 받을지 확인하세요." />
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
