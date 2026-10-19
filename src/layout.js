import { site, absUrl } from './site.js';
import { esc } from './ui.js';

const json = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

/** 페이지 깊이에 맞춘 상대 경로 접두어 (BASE_PATH와 무관하게 동작) */
const rel = (depth) => (depth === 0 ? './' : '../'.repeat(depth));

function head({ title, description, path, depth, jsonLd = [] }) {
  const canonical = absUrl(path);
  const r = rel(depth);
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="ko_KR">
<meta property="og:image" content="${absUrl('og.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0f766e">
${site.googleVerify ? `<meta name="google-site-verification" content="${esc(site.googleVerify)}">` : ''}
${site.naverVerify ? `<meta name="naver-site-verification" content="${esc(site.naverVerify)}">` : ''}
<link rel="icon" href="${r}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${r}assets/style.css">
${jsonLd.map((d) => `<script type="application/ld+json">${json(d)}</script>`).join('\n')}
${
  site.adsenseClient
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(site.adsenseClient)}" crossorigin="anonymous"></script>`
    : ''
}
${
  site.gaId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(site.gaId)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(site.gaId)}');</script>`
    : ''
}
</head>`;
}

/** 광고 자리. ADSENSE_CLIENT가 없으면 아무것도 출력하지 않는다(승인 전 비활성). */
export const adSlot = (name) =>
  site.adsenseClient
    ? `<aside class="ad" aria-label="광고"><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(site.adsenseClient)}" data-ad-format="auto" data-full-width-responsive="true" data-slot-name="${name}"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></aside>`
    : '';

function header(depth, nav) {
  const r = rel(depth);
  return `<header class="site-header">
  <a class="brand" href="${r}">${site.name}</a>
  <nav aria-label="주요 계산기">${nav.map((p) => `<a href="${r}${p.slug}/">${esc(p.h1.replace(/ ?\(.*\)$/, ''))}</a>`).join('')}</nav>
</header>`;
}

function footer(depth) {
  const r = rel(depth);
  return `<footer class="site-footer">
  <p>${site.name}의 계산 결과는 공개된 법령·고시를 바탕으로 한 추정치이며 법적 효력이 없습니다. 실제 금액은 회사·금융기관·관계 기관에서 확인하세요.</p>
  <p><a href="${r}about/">사이트 소개</a> · <a href="${r}privacy/">개인정보처리방침</a></p>
</footer>`;
}

export function renderPage({ title, description, path, depth, jsonLd, nav, main, scripts = [] }) {
  return `${head({ title, description, path, depth, jsonLd })}
<body>
${header(depth, nav)}
<main class="container">
${main}
</main>
${footer(depth)}
${scripts.map((s) => `<script type="module" src="${rel(depth)}${s}"></script>`).join('\n')}
</body>
</html>
`;
}

/** 계산기 상세 페이지 본문 */
export function calculatorMain(page, related) {
  return `<nav class="crumbs" aria-label="현재 위치"><a href="../">홈</a> › <span>${esc(page.category)}</span></nav>
<h1>${esc(page.h1)}</h1>
<p class="lead">${esc(page.description)}</p>
${page.body}
${adSlot('below-calculator')}
<article class="prose">
${page.article}
${
  page.faq?.length
    ? `<h2>자주 묻는 질문</h2>\n${page.faq.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}`
    : ''
}
${
  page.sources?.length
    ? `<h2>참고 자료</h2><ul class="sources">${page.sources.map(([l, u]) => `<li><a href="${esc(u)}" rel="nofollow noopener" target="_blank">${esc(l)}</a></li>`).join('')}</ul>`
    : ''
}
<p class="updated">최종 업데이트: <time datetime="${page.updated}">${page.updated}</time></p>
</article>
${adSlot('below-article')}
<section class="related">
<h2>함께 쓰는 계산기</h2>
<div class="tiles">${related.map((p) => tile(p, 1)).join('')}</div>
</section>`;
}

export const tile = (p, depth) =>
  `<a class="tile" href="${rel(depth)}${p.slug}/"><span class="tile-icon" aria-hidden="true">${p.icon}</span><strong>${esc(p.h1)}</strong><small>${esc(p.category)}</small></a>`;

export function calculatorJsonLd(page) {
  const url = absUrl(`${page.slug}/`);
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: page.h1,
      url,
      description: page.description,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      inLanguage: 'ko',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
      dateModified: page.updated,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: site.name, item: absUrl() },
        { '@type': 'ListItem', position: 2, name: page.h1, item: url },
      ],
    },
  ];
  if (page.faq?.length) {
    data.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    });
  }
  return data;
}
