type BrowserLocation = { hostname: string; protocol: string };

export function resolveApiUrl(configured?: string, location?: BrowserLocation): string {
  const value = configured?.trim();
  if (!value) {
    if (location && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) && location.protocol === 'http:') {
      return `http://${location.hostname}:3000`;
    }
    throw new Error('EXPO_PUBLIC_API_URL에 접속 가능한 API 주소를 설정하고 앱을 다시 빌드해주세요.');
  }
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('EXPO_PUBLIC_API_URL은 올바른 http(s) 주소여야 합니다.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('EXPO_PUBLIC_API_URL은 인증정보·쿼리·해시가 없는 http(s) 주소여야 합니다.');
  }
  if (location?.protocol === 'https:' && url.protocol !== 'https:') {
    throw new Error('HTTPS 화면에서는 HTTPS API 주소가 필요합니다. EXPO_PUBLIC_API_URL을 수정해주세요.');
  }
  if (location && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('배포 화면에서는 localhost API에 연결할 수 없습니다. 실제 API 주소로 다시 빌드해주세요.');
  }
  return url.toString().replace(/\/+$/, '');
}
