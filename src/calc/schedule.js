// 프리랜서·N잡러 세금 일정. 날짜가 주말·공휴일이면 다음 영업일로 미뤄질 수 있다.

/** [id, 제목, 시작 월, 시작 일, 끝 월, 끝 일, 설명] */
export const TAX_EVENTS = [
  ['income-tax', '종합소득세 확정신고·납부', 5, 1, 5, 31, '지난해 소득을 신고하고 3.3%로 미리 낸 세금을 정산해 환급받거나 추가로 냅니다.'],
  ['earned-credit', '근로·자녀장려금 정기 신청', 5, 1, 5, 31, '소득·재산이 일정 기준 이하인 프리랜서·근로자는 장려금을 신청할 수 있습니다.'],
  ['faithful', '성실신고확인대상자 신고 마감', 6, 1, 6, 30, '수입이 큰 사업자(인적용역 7.5억원 이상 등)는 6월 말까지 신고합니다.'],
  ['interim', '종합소득세 중간예납', 11, 1, 11, 30, '지난해 종소세의 절반을 미리 냅니다. 고지액 50만원 미만이면 내지 않습니다.'],
  ['nhis', '건강보험 피부양자·지역보험료 재산정', 11, 1, 11, 30, '5월 신고한 소득이 반영돼 피부양자 자격과 지역가입자 보험료가 다시 정해집니다.'],
  ['year-end', '직장인 연말정산 (N잡러)', 1, 15, 2, 28, '회사 연말정산은 근로소득만 정산합니다. 부업 소득은 5월에 합산 신고하세요.'],
];

const DAY = 86_400_000;
const utc = (y, m, d) => Date.UTC(y, m - 1, d);

/** today(Date) 기준으로 각 일정의 다음(또는 진행 중인) 기간과 D-day를 구한다. 가까운 순 정렬. */
export function upcomingEvents(today) {
  const t = utc(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return TAX_EVENTS.map(([id, title, sm, sd, em, ed, description]) => {
    let year = today.getFullYear();
    let start = utc(year, sm, sd);
    let end = utc(year, em, ed);
    if (end < t) {
      year += 1;
      start = utc(year, sm, sd);
      end = utc(year, em, ed);
    }
    const ongoing = start <= t && t <= end;
    const days = Math.round(((ongoing ? end : start) - t) / DAY);
    return { id, title, description, start: new Date(start), end: new Date(end), ongoing, days };
  }).sort((a, b) => (a.ongoing === b.ongoing ? a.days - b.days : a.ongoing ? -1 : 1));
}

/**
 * 일정별 알림 시각: 시작일 오전 9시, 마감 3일 전 오전 9시(현지 시각). now 이후만 돌려준다.
 * 진행 중인 일정이 있어도 다음 해 알림이 빠지지 않도록 다음 일정과 그다음 해 일정을 함께 만든다.
 * @returns {{key:string, title:string, body:string, date:Date}[]}
 */
export function reminderTimes(now) {
  const out = [];
  for (const e of upcomingEvents(now)) {
    for (const offset of [0, 1]) {
      const y = e.start.getUTCFullYear() + offset;
      const [, , sm, sd, em, ed] = TAX_EVENTS.find(([id]) => id === e.id);
      const startLocal = new Date(y, sm - 1, sd, 9);
      const endLocal = new Date(y, em - 1, ed - 3, 9);
      const range = `${sm}월 ${sd}일 ~ ${em}월 ${ed}일`;
      out.push({ key: `${e.id}:${y}:start`, title: `${e.title} 시작`, body: `${range}. ${e.description}`, date: startLocal });
      out.push({ key: `${e.id}:${y}:due`, title: `${e.title} 마감 3일 전`, body: `${em}월 ${ed}일 마감입니다. ${e.description}`, date: endLocal });
    }
  }
  return out.filter((r) => r.date > now).sort((a, b) => a.date - b.date);
}
