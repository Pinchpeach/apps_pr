const DAY = 86_400_000;

/** 'YYYY-MM-DD' → UTC 자정 기준 Date (시간대 영향 제거) */
export function parseDate(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) return null;
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return date.getUTCMonth() === +m[2] - 1 ? date : null;
}

export const formatDate = (date) => date.toISOString().slice(0, 10);

export const daysBetween = (from, to) => Math.round((to - from) / DAY);

export const addDays = (date, days) => new Date(date.getTime() + days * DAY);

/** 월 단위 이동. 대상 월에 같은 날짜가 없으면 그 달 말일로 맞춘다. */
export function addMonths(date, months) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(date.getUTCDate(), lastDay)));
}

/** D-day: target이 base보다 미래면 음수(D-n), 과거면 양수(D+n). */
export function calcDday(base, target) {
  const diff = daysBetween(base, target);
  return { diff, label: diff === 0 ? 'D-Day' : diff > 0 ? `D-${diff}` : `D+${-diff}`, countingFromOne: -diff + 1 };
}
