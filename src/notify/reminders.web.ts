// 웹 빌드(화면 확인용)에서는 로컬 알림을 지원하지 않는다.
export const remindersSupported = false;
export async function scheduleReminders(): Promise<number | null> {
  return null;
}
export async function cancelReminders() {}
