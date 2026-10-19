/** A의 B% */
export const percentOf = (a, b) => (a * b) / 100;

/** A는 B의 몇 % */
export const ratioPercent = (a, b) => (b === 0 ? NaN : (a / b) * 100);

/** A에서 B로 변하면 몇 % 증감 */
export const changePercent = (from, to) => (from === 0 ? NaN : ((to - from) / Math.abs(from)) * 100);

/** A를 B% 늘리거나(+) 줄인(-) 값 */
export const applyPercent = (a, b) => a * (1 + b / 100);
