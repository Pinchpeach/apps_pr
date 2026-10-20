import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';
import { Paragraph } from '@/components/Result';
import { Card, Screen } from '@/components/Screen';
import { resetAllPersistent } from '@/storage/usePersistentState';
import { useTheme } from '@/theme';

const LINKS: [string, string][] = [
  ['개인정보처리방침', 'https://github.com/Pinchpeach/apps_pr/blob/main/docs/privacy-policy.md'],
  ['문의·오류 제보', 'https://github.com/Pinchpeach/apps_pr/issues'],
  ['국세청 홈택스', 'https://hometax.go.kr'],
  ['국민건강보험공단', 'https://www.nhis.or.kr'],
];

export default function AboutScreen() {
  const t = useTheme();
  const [cleared, setCleared] = useState(false);
  return (
    <Screen title="프리셈" subtitle={`버전 ${Constants.expoConfig?.version ?? ''}`} underHeader>
      <Card>
        <Paragraph>
          프리셈은 3.3% 떼이는 프리랜서와 N잡러를 위한 세금·건강보험 계산 앱입니다. 소득세법·시행령·시행규칙과 국세청·건강보험공단 기준을 바탕으로 계산하며, 업종별 경비율처럼 매년
          바뀌는 값은 참고값으로 표시합니다.
        </Paragraph>
        <Paragraph>입력한 숫자는 이 기기에만 저장되고 어디로도 전송되지 않습니다. 회원가입, 광고, 분석 도구가 없습니다.</Paragraph>
      </Card>
      <Card>
        {LINKS.map(([label, url]) => (
          <Text key={url} role="link" style={[styles.link, { color: t.accent }]} onPress={() => Linking.openURL(url)}>
            {label} ↗
          </Text>
        ))}
      </Card>
      <Pressable
        role="button"
        onPress={async () => {
          await resetAllPersistent();
          setCleared(true);
        }}
        style={[styles.reset, { borderColor: t.warn }]}>
        <Text style={{ color: t.warn, fontWeight: '700' }}>{cleared ? '모든 입력값과 수입 기록을 지웠습니다.' : '저장된 입력값·수입 기록 모두 지우기'}</Text>
      </Pressable>
      <Paragraph>계산 결과는 추정치이며 법적 효력이 없습니다. 실제 신고는 홈택스 또는 세무 전문가에게 확인하세요.</Paragraph>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { fontSize: 15, fontWeight: '600', paddingVertical: 4 },
  reset: { borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
});
