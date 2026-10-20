// 세금 일정 로컬 알림 (기기 안에서만 예약, 서버·푸시 없음). 웹 빌드는 reminders.web.ts.
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { reminderTimes } from '@/calc/schedule';

export const remindersSupported = true;

// 예약·취소 요청을 순서대로 처리하고, 나중 요청이 오면 앞선 예약은 중단한다.
let queue: Promise<unknown> = Promise.resolve();
let generation = 0;
const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

/** 권한을 받고 앞으로의 일정 알림을 모두 다시 예약한다. 예약한 개수를 돌려주며, 권한이 없으면 null. */
export function scheduleReminders(): Promise<number | null> {
  const mine = ++generation;
  return enqueue(() => schedule(mine));
}

async function schedule(mine: number): Promise<number | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('deadlines', { name: '세금 일정 알림', importance: AndroidImportance.DEFAULT });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return null;
  if (mine !== generation) return 0; // 그사이 끄거나 다시 요청함
  // 이 앱이 예약하는 알림은 세금 일정뿐이므로 모두 지우고 다시 만든다(해가 바뀌면 다음 해 일정으로 갱신).
  await Notifications.cancelAllScheduledNotificationsAsync();
  const items = reminderTimes(new Date());
  for (const item of items) {
    if (mine !== generation) break;
    await Notifications.scheduleNotificationAsync({
      identifier: item.key,
      content: { title: item.title, body: item.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.date, channelId: 'deadlines' },
    });
  }
  return items.length;
}

export function cancelReminders(): Promise<void> {
  generation++;
  return enqueue(() => Notifications.cancelAllScheduledNotificationsAsync());
}
