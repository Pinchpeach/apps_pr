import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pages } from '../src/pages.js';
import { site, absUrl } from '../src/site.js';
import { renderPage, calculatorMain, calculatorJsonLd, tile, adSlot } from '../src/layout.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');

async function emit(path, html) {
  const file = join(out, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

const nav = pages.filter((p) => ['salary', 'loan', 'savings', 'acquisition-tax', 'severance', 'unemployment', 'brokerage', 'wage'].includes(p.slug));

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, 'src/calc'), join(out, 'js/calc'), { recursive: true });
await cp(join(root, 'src/client'), join(out, 'js/client'), { recursive: true });
await cp(join(root, 'public'), out, { recursive: true });

// 계산기 페이지
for (const page of pages) {
  const related = pages.filter((p) => p !== page && p.category === page.category).concat(pages.filter((p) => p.category !== page.category)).slice(0, 4);
  await emit(
    `${page.slug}/index.html`,
    renderPage({
      title: `${page.title} | ${site.name}`,
      description: page.description,
      path: `${page.slug}/`,
      depth: 1,
      jsonLd: calculatorJsonLd(page),
      nav,
      main: calculatorMain(page, related),
      scripts: page.script ? [`js/client/${page.script}.js`] : [],
    }),
  );
}

// 홈
const categories = [...new Set(pages.map((p) => p.category))];
await emit(
  'index.html',
  renderPage({
    title: `${site.name} — ${site.tagline}`,
    description: '2026년 기준 연봉 실수령액, 대출이자, 적금 이자, 퇴직금, 부동산 중개수수료, 시급·주휴수당 계산기를 무료로 제공합니다. 국세청 간이세액표 원문을 그대로 적용합니다.',
    path: '',
    depth: 0,
    nav,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.name,
        url: absUrl(),
        inLanguage: 'ko',
      },
    ],
    main: `<section class="hero">
<h1>${site.name}</h1>
<p class="lead">${site.tagline}. 법령·고시 원문을 기준으로 계산하고, 근거와 기준일을 페이지마다 밝힙니다.</p>
</section>
${categories
  .map(
    (c) => `<section class="category"><h2>${c}</h2><div class="tiles">${pages
      .filter((p) => p.category === c)
      .map((p) => tile(p, 0))
      .join('')}</div></section>`,
  )
  .join('\n')}
${adSlot('home')}`,
  }),
);

// 정보 페이지 (애드센스 심사에 필요한 소개·개인정보처리방침)
const contact = site.contactEmail ? `<p>문의: <a href="mailto:${site.contactEmail}">${site.contactEmail}</a></p>` : '';
const infoPages = [
  {
    slug: 'about',
    title: '사이트 소개',
    body: `<h1>${site.name} 소개</h1>
<div class="prose">
<p>${site.name}는 급여, 세금, 대출, 저축, 부동산처럼 돈과 관련된 계산을 누구나 정확하고 빠르게 할 수 있도록 만든 무료 계산기 모음입니다.</p>
<h2>계산 원칙</h2>
<ul>
<li>세율·요율은 법령과 관계 기관 고시를 기준으로 하며, 각 페이지에 기준일과 참고 자료를 표시합니다.</li>
<li>근로소득세는 근사식이 아니라 국세청 근로소득 간이세액표 원문을 그대로 사용합니다.</li>
<li>입력한 값은 서버로 전송되지 않고 브라우저 안에서만 계산됩니다.</li>
</ul>
<p>계산 결과는 추정치이며 법적 효력이 없습니다. 오류를 발견하시면 알려주세요.</p>
${contact}
</div>`,
  },
  {
    slug: 'privacy',
    title: '개인정보처리방침',
    body: `<h1>개인정보처리방침</h1>
<div class="prose">
<p>${site.name}(이하 "사이트")는 회원가입이 없으며, 계산기에 입력한 값은 이용자의 브라우저에서만 처리되고 서버에 저장하거나 전송하지 않습니다.</p>
<h2>쿠키와 광고</h2>
<p>사이트는 방문 통계 분석(Google Analytics)과 광고 게재(Google AdSense)를 위해 쿠키를 사용할 수 있습니다.
Google을 포함한 제3자 공급업체는 쿠키를 사용해 이용자의 이전 방문 기록을 바탕으로 광고를 게재합니다.
이용자는 <a href="https://adssettings.google.com" rel="nofollow noopener" target="_blank">Google 광고 설정</a>에서 맞춤 광고를 해제할 수 있으며,
<a href="https://policies.google.com/technologies/ads?hl=ko" rel="nofollow noopener" target="_blank">Google의 광고 정책</a>에서 자세한 내용을 확인할 수 있습니다.</p>
<h2>수집하는 정보</h2>
<p>사이트는 이름, 연락처 등 개인을 식별할 수 있는 정보를 직접 수집하지 않습니다. 분석 도구가 수집하는 정보는 익명화된 방문 통계(브라우저 종류, 방문 페이지, 체류 시간 등)입니다.</p>
${contact}
<p>시행일: 2026-10-19</p>
</div>`,
  },
];
for (const p of infoPages) {
  await emit(
    `${p.slug}/index.html`,
    renderPage({ title: `${p.title} | ${site.name}`, description: `${site.name} ${p.title}`, path: `${p.slug}/`, depth: 1, nav, main: p.body }),
  );
}

// 404 (GitHub Pages는 루트의 404.html을 사용한다. 경로 깊이를 모르므로 절대 경로 사용)
const notFound = renderPage({
  title: `페이지를 찾을 수 없습니다 | ${site.name}`,
  description: '요청한 페이지가 없습니다.',
  path: '404.html',
  depth: 0,
  nav,
  main: `<h1>페이지를 찾을 수 없습니다</h1><p class="lead">주소가 바뀌었거나 삭제된 페이지입니다.</p><div class="tiles">${pages.map((p) => tile(p, 0)).join('')}</div>`,
}).replaceAll('href="./', `href="${site.basePath}`);
await emit('404.html', notFound);

// sitemap, robots, ads.txt
const urls = ['', ...pages.map((p) => `${p.slug}/`), ...infoPages.map((p) => `${p.slug}/`)];
const lastmod = Object.fromEntries(pages.map((p) => [`${p.slug}/`, p.updated]));
await emit(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${absUrl(u)}</loc>${lastmod[u] ? `<lastmod>${lastmod[u]}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`,
);
await emit('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${absUrl('sitemap.xml')}\n`);
if (site.adsenseClient) {
  await emit('ads.txt', `google.com, ${site.adsenseClient.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);
}

const count = pages.length + infoPages.length + 2;
console.log(`built ${count} pages → dist/ (base ${site.basePath}, url ${site.url}, ads ${site.adsenseClient ? 'ON' : 'off'})`);
