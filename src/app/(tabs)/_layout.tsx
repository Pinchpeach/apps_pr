import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '@/theme';

const icon = (emoji: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
  };

export default function TabLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: '환급 예상', tabBarIcon: icon('💸') }} />
      <Tabs.Screen name="njob" options={{ title: 'N잡 세금', tabBarIcon: icon('💼') }} />
      <Tabs.Screen name="withholding" options={{ title: '3.3%·8.8%', tabBarIcon: icon('✂️') }} />
      <Tabs.Screen name="dependent" options={{ title: '피부양자', tabBarIcon: icon('🛡️') }} />
      <Tabs.Screen name="schedule" options={{ title: '세금 일정', tabBarIcon: icon('📅') }} />
    </Tabs>
  );
}
