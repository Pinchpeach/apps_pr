export const MIN_WAGE = { year: 2026, hourly: 10_320 };

const WEEKS_PER_MONTH = 365 / 7 / 12;

/** 주 소정근로시간 15시간 이상이면 주휴시간 = 소정근로시간/40 × 8 (최대 8시간) */
export const weeklyHolidayHours = (weeklyHours) => (weeklyHours >= 15 ? Math.min(weeklyHours, 40) / 5 : 0);

/** 월 유급 환산 시간 (주 40시간 → 209시간) */
export const monthlyPaidHours = (weeklyHours) => Math.round((weeklyHours + weeklyHolidayHours(weeklyHours)) * WEEKS_PER_MONTH);

/** 시급 → 주급/월급/연봉 */
export function hourlyToPay({ hourly, weeklyHours }) {
  const holidayPay = Math.round(hourly * weeklyHolidayHours(weeklyHours));
  const weekly = Math.round(hourly * weeklyHours) + holidayPay;
  const hours = monthlyPaidHours(weeklyHours);
  const monthly = Math.round(hourly * hours);
  return { holidayPay, weekly, monthlyHours: hours, monthly, annual: monthly * 12, belowMinimum: hourly < MIN_WAGE.hourly };
}

/** 월급 → 시급 (주휴 포함 유급시간 기준) */
export function monthlyToHourly({ monthly, weeklyHours }) {
  const hours = monthlyPaidHours(weeklyHours);
  const hourly = hours > 0 ? Math.floor(monthly / hours) : 0;
  return { monthlyHours: hours, hourly, belowMinimum: hourly < MIN_WAGE.hourly };
}
