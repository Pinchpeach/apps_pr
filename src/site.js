// 사이트 설정. 배포 환경마다 다른 값은 환경변수로 받는다.
//  SITE_URL       : 정식 주소 (예: https://example.com) — canonical, sitemap에 사용
//  BASE_PATH      : 하위 경로 배포 시 접두어 (예: /apps_pr/), 기본 '/'
//  ADSENSE_CLIENT : 애드센스 게시자 ID (ca-pub-…). 비어 있으면 광고 코드를 넣지 않는다.
//  GA_ID          : Google Analytics 4 측정 ID (G-…). 비어 있으면 넣지 않는다.
//  GSC_VERIFY     : Google Search Console 소유권 확인 메타 태그 값
//  NAVER_VERIFY   : 네이버 서치어드바이저 소유권 확인 메타 태그 값

const env = process.env;
const basePath = `/${(env.BASE_PATH ?? '/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');

export const site = {
  name: '머니계산기',
  tagline: '연봉·대출·적금·퇴직금, 2026년 기준으로 정확하게',
  url: (env.SITE_URL || 'https://example.com').replace(/\/+$/, ''),
  basePath,
  adsenseClient: env.ADSENSE_CLIENT || '',
  gaId: env.GA_ID || '',
  googleVerify: env.GSC_VERIFY || '',
  naverVerify: env.NAVER_VERIFY || '',
  contactEmail: env.CONTACT_EMAIL || '',
};

/** 절대 URL (canonical, sitemap용) */
export const absUrl = (path = '') => `${site.url}${site.basePath}${path}`;
