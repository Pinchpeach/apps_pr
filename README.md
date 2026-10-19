# 머니계산기

2026년 기준 한국 금융 계산기 모음 정적 사이트입니다. 검색 유입 → 광고(애드센스) 수익을 목표로 합니다.
작업 원칙은 [RULES.md](RULES.md), 벤치마킹 근거는 [docs/benchmark.md](docs/benchmark.md)에 있습니다.

## 계산기

| 경로 | 내용 | 기준 |
|---|---|---|
| `/salary/` | 연봉 실수령액 | 4대보험 2026.7 요율, 근로소득 간이세액표(2026.2.27 개정) 원문 |
| `/salary-table/` | 연봉별 실수령액 표 | 위와 동일, 빌드 시 생성 |
| `/loan/` | 대출이자 (원리금균등·원금균등·만기일시, 거치) | |
| `/savings/` | 예금·적금 이자, 세후 수령액 | 이자소득세 15.4% / 9.5% / 비과세 |
| `/severance/` | 퇴직금 | 근로자퇴직급여 보장법 평균임금 |
| `/brokerage/` | 부동산 중개수수료 | 2021.10.19 시행 요율 |
| `/wage/` | 시급↔월급, 주휴수당 | 2026 최저임금 10,320원 |
| `/percent/`, `/dday/` | 퍼센트, 날짜 | |

## 개발

의존성이 없습니다. Node.js 20 이상만 있으면 됩니다.

```bash
npm test          # 계산 로직 단위 테스트
npm run build     # dist/ 에 정적 사이트 생성
npm run dev       # 빌드 후 http://localhost:4173 에서 확인
```

구조: `src/calc/` 순수 계산 함수(브라우저·테스트 공용) · `src/client/` 페이지별 브라우저 스크립트 ·
`src/pages.js` 페이지 내용 · `src/layout.js` HTML 레이아웃·SEO · `scripts/build.mjs` 생성기.

간이세액표가 개정되면 국가법령정보센터에서 별표2 PDF를 받아 다음을 실행합니다.

```bash
pdftotext -layout 별표2.pdf table.txt
python3 -I scripts/parse-tax-table.py table.txt src/calc/taxTable.js
npm test
```

## 배포 (GitHub Pages)

`main`에 푸시되면 `.github/workflows/site.yml`이 테스트 후 GitHub Pages로 배포합니다.
처음 한 번 저장소 **Settings → Pages → Source: GitHub Actions** 를 선택해야 합니다.

선택 설정은 **Settings → Secrets and variables → Actions → Variables** 에 넣습니다. 비어 있으면 해당 기능은 꺼집니다.

| 변수 | 용도 |
|---|---|
| `SITE_URL` | 커스텀 도메인 (예: `https://moneycalc.kr`). 없으면 GitHub Pages 주소 |
| `ADSENSE_CLIENT` | 애드센스 게시자 ID `ca-pub-…` — 설정 시 광고 코드와 `ads.txt` 생성 |
| `GA_ID` | Google Analytics 4 측정 ID |
| `GSC_VERIFY`, `NAVER_VERIFY` | 구글 서치콘솔·네이버 서치어드바이저 소유권 확인 값 |
| `CONTACT_EMAIL` | 소개·개인정보처리방침 페이지의 문의 주소 |
