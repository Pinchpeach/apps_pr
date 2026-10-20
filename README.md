# 프리셈

3.3% 떼이는 **프리랜서·N잡러를 위한 세금·보험 계산 앱**입니다. Expo(React Native)로 만든 Android·iOS 앱이며,
모든 계산은 기기 안에서만 이루어집니다(서버 없음, 오프라인 동작).
작업 원칙은 [RULES.md](RULES.md), 벤치마킹 근거는 [docs/benchmark.md](docs/benchmark.md)에 있습니다.

## 화면

| 탭 | 내용 | 근거 |
|---|---|---|
| 환급 예상 | 5월 종합소득세 환급·추가납부 추정, 단순/기준경비율 자동 판정, 2.8·3.4배 상한 | 소득세법 시행령 제143조, 시행규칙 제67조 |
| N잡 세금 | 직장인 원천징수영수증 + 3.3% 부업 합산 시 추가 납부액 | 소득세법 제47조·제59조 |
| 3.3%·8.8% | 사업소득 3.3% 세전↔실수령 역산, 기타소득 8.8%와 분리/종합과세 비교 | 소득세법 제84조 등 |
| 근로장려금 | 가구 유형별 자격 판정과 예상 지급액 (환급·일정 탭에서 이동) | 조세특례제한법 제100조의3·5·7, 시행령 제100조의3 |
| 세금 일정 | 신고·납부 기간 D-day, 시작일·마감 3일 전 로컬 알림 | — |
| 피부양자 | 건강보험 피부양자 유지 여부, 남은 여유 소득, 탈락 시 지역가입자 보험료 | 피부양자 요건, 국민건강보험법 시행령 제44조·별표 4, 시행규칙 제44조·별표 8 |

업종별 경비율(`INDUSTRY_PRESETS`)은 매년 국세청 고시로 바뀌는 참고값이며 앱에서 수정할 수 있습니다.

## 구조

- `src/app/` — Expo Router 화면 (`(tabs)/` 하단 탭 4개)
- `src/components/` — 입력 필드, 결과 카드, 업종 선택
- `src/calc/` — 계산 엔진 (순수 JS, `node --test`로 검증). `freelancer.js`가 앱의 핵심이며 나머지는 이전 계산기 사이트에서 남은 모듈입니다.
- `test/` — 계산 엔진 단위 테스트

## 개발

```bash
npm install
npm test            # 계산 엔진 테스트
npm run typecheck   # TypeScript 검사
npm run lint        # ESLint
npm run test:e2e    # 화면 회귀 테스트 (웹 export + Playwright)
npx expo start      # Expo Go 또는 에뮬레이터에서 실행
```

## 빌드·출시 (EAS)

`eas.json`에 프로필이 있습니다. Expo 계정이 필요합니다.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android     # 테스트용 APK
npx eas-cli@latest build --profile production --platform android  # Play 스토어용 AAB
npx eas-cli@latest submit --platform android                      # Play Console 내부 테스트 트랙
```

- Android 패키지명 / iOS 번들 ID: `com.pinchpeach.freesem` (출시 후 변경 불가)
- Play 스토어 출시에는 Google Play 개발자 계정(1회 $25)이, iOS에는 Apple Developer Program(연 $99)이 필요합니다.
