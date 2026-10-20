import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { readItem, writeItem } from './kv';

const PREFIX = 'freesem:v1:';

/** useState와 같지만 값을 기기에 저장해 앱을 다시 열어도 유지한다. */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stored = readItem(PREFIX + key);
    if (stored === null) return initial;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    writeItem(PREFIX + key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}
