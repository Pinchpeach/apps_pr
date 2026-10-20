import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

/** 탭 화면 공통 틀: 제목·설명 + 스크롤 본문 */
export function Screen({ title, subtitle, children, underHeader = false }: { title: string; subtitle?: string; children: ReactNode; underHeader?: boolean }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={[styles.content, { paddingTop: underHeader ? 16 : insets.top + 12 }]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: t.muted }]}>{subtitle}</Text> : null}
      </View>
      {children}
    </ScrollView>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.line }]}>{children}</View>;
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48, gap: 14, maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: { gap: 6, marginBottom: 2 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 14 },
});
