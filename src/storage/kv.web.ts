// 웹 빌드(화면 확인용)는 localStorage를 쓴다.
export function readItem(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeItem(key: string, value: string) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    /* 사생활 보호 모드 등에서는 저장하지 않는다 */
  }
}
