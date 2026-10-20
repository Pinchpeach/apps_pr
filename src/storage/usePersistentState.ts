import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { readItem, writeItem } from './kv';

const PREFIX = 'freesem:v1:';

// 같은 키를 쓰는 화면끼리 값을 맞추기 위한 구독자 목록 (예: 수입 기록 → 환급 탭)
const listeners = new Map<string, Set<(json: string) => void>>();

function read<T>(key: string, initial: T): T {
  const stored = readItem(PREFIX + key);
  if (stored === null) return initial;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return initial;
  }
}

/** 다른 화면에서 값을 바꿀 때 쓴다. 저장하고 같은 키를 쓰는 화면에 알린다. */
export function setPersistentValue<T>(key: string, value: T) {
  const json = JSON.stringify(value);
  writeItem(PREFIX + key, json);
  listeners.get(key)?.forEach((notify) => notify(json));
}

/** useState와 같지만 값을 기기에 저장해 앱을 다시 열어도 유지하고, 같은 키를 쓰는 화면끼리 동기화한다. */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => read(key, initial));

  useEffect(() => {
    const notify = (json: string) => {
      setValue((current) => (JSON.stringify(current) === json ? current : (JSON.parse(json) as T)));
    };
    const set = listeners.get(key) ?? new Set();
    set.add(notify);
    listeners.set(key, set);
    return () => {
      set.delete(notify);
    };
  }, [key]);

  useEffect(() => {
    setPersistentValue(key, value);
  }, [key, value]);

  return [value, setValue];
}
