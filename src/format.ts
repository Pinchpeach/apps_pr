export const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

export const signedWon = (n: number) => `${n >= 0 ? '+' : '-'}${won(Math.abs(n))}`;

export const percent = (r: number, digits = 1) => `${Number((r * 100).toFixed(digits))}%`;

/** 1억 2,345만원 형태의 읽기 쉬운 한글 금액 */
export function koreanAmount(n: number) {
  const v = Math.round(Math.abs(n));
  if (v < 10_000) return `${v.toLocaleString('ko-KR')}원`;
  const eok = Math.floor(v / 100_000_000);
  const man = Math.floor((v % 100_000_000) / 10_000);
  const rest = v % 10_000;
  const parts: string[] = [];
  if (eok) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (man) parts.push(`${man.toLocaleString('ko-KR')}만`);
  if (rest) parts.push(rest.toLocaleString('ko-KR'));
  return `${n < 0 ? '-' : ''}${parts.join(' ')}원`;
}
