import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// 앱이 켜져 있을 때 도착한 일정 알림도 보이도록 알림 처리기를 먼저 등록한다.
import '@/notify/reminders';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ title: '앱 정보', headerBackTitle: '뒤로' }} />
        <Stack.Screen name="eitc" options={{ title: '근로장려금', headerBackTitle: '뒤로' }} />
      </Stack>
    </>
  );
}
