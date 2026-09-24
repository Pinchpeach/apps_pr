import { resolveApiUrl } from './apiConfig';

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, typeof window === 'undefined' ? undefined : window.location);
  try {
    return await fetch(base + path, init);
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new Error(`API에 연결하지 못했습니다 (${base}). 서버 실행 상태와 CORS_ORIGIN 설정을 확인해주세요.`);
  }
}
