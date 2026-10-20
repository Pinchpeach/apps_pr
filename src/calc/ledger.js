// 수입 기록(장부): 지급 건별 기록을 연도별로 합산한다.
import { otherIncomeWithholding, withholding33 } from './freelancer.js';

/**
 * @typedef {{id:string, date:string, payer:string, gross:number, kind:'business'|'other'}} Entry
 *   date: 'YYYY-MM-DD', gross: 세전 지급액, kind: 사업소득 3.3% | 기타소득 8.8%
 */

/** 기록 목록 → 해당 연도 합계 */
export function summarizeYear(entries, year) {
  const rows = entries.filter((e) => e.date.startsWith(`${year}-`));
  const sum = { business: 0, other: 0, withheldIncomeTax: 0, withheldLocalTax: 0, businessWithheld: 0, net: 0, count: rows.length };
  for (const e of rows) {
    const w = e.kind === 'other' ? otherIncomeWithholding(e.gross) : withholding33(e.gross);
    sum[e.kind] += e.gross;
    sum.withheldIncomeTax += w.incomeTax;
    if (e.kind === 'business') sum.businessWithheld += w.incomeTax;
    sum.withheldLocalTax += w.localTax;
    sum.net += w.net;
  }
  return sum;
}

/** 월별 사업·기타 수입 합계 (1~12월) */
export function monthlyTotals(entries, year) {
  const months = Array.from({ length: 12 }, () => 0);
  for (const e of entries) if (e.date.startsWith(`${year}-`)) months[Number(e.date.slice(5, 7)) - 1] += e.gross;
  return months;
}

/** 기록에 있는 연도들(최근 순) */
export const recordedYears = (entries) => [...new Set(entries.map((e) => Number(e.date.slice(0, 4))))].sort((a, b) => b - a);

/** 날짜 최신 순 정렬 */
export const sortEntries = (entries) => [...entries].sort((a, b) => (a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1));

/** 해당 연도 지급처별 합계 (많은 순) */
export function totalsByPayer(entries, year) {
  const map = new Map();
  for (const e of entries) {
    if (!e.date.startsWith(`${year}-`)) continue;
    const cur = map.get(e.payer) ?? { payer: e.payer, gross: 0, count: 0 };
    cur.gross += e.gross;
    cur.count += 1;
    map.set(e.payer, cur);
  }
  return [...map.values()].sort((a, b) => b.gross - a.gross);
}

const csvCell = (v) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** 기록 → CSV (엑셀에서 한글이 깨지지 않도록 BOM 포함). 원천징수 세액도 함께 적는다. */
export function toCsv(entries) {
  const header = ['날짜', '지급처', '구분', '세전 지급액', '소득세', '지방소득세', '실수령액'];
  const rows = sortEntries(entries)
    .reverse()
    .map((e) => {
      const w = e.kind === 'other' ? otherIncomeWithholding(e.gross) : withholding33(e.gross);
      return [e.date, e.payer, e.kind === 'other' ? '기타소득 8.8%' : '사업소득 3.3%', e.gross, w.incomeTax, w.localTax, w.net];
    });
  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}
