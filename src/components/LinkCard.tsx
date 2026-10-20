import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

/** 다른 화면으로 넘어가는 안내 카드 (Link asChild는 웹에서 스타일 배열을 DOM에 넘겨 깨지므로 router.push 사용) */
export function LinkCard({ href, title, body }: { href: Href; title: string; body: string }) {
  const t = useTheme();
  const router = useRouter();
  return (
    <Pressable role="link" aria-label={title} onPress={() => router.push(href)} style={[styles.card, { backgroundColor: t.accentSoft, borderColor: t.accent }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }}>{title}</Text>
        <Text style={{ color: t.muted, fontSize: 13, lineHeight: 19 }}>{body}</Text>
      </View>
      <Text style={{ color: t.accent, fontWeight: '800', fontSize: 18 }}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 16 },
});
