// 기기 안 키-값 저장소 (SQLite). 웹 빌드는 kv.web.ts를 쓴다.
import Storage from 'expo-sqlite/kv-store';

export function readItem(key: string): string | null {
  try {
    return Storage.getItemSync(key);
  } catch {
    return null;
  }
}

export function writeItem(key: string, value: string) {
  try {
    Storage.setItemSync(key, value);
  } catch {
    /* 저장 실패는 계산에 영향이 없으므로 무시한다 */
  }
}
