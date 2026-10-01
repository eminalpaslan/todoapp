// Backend'deki period_key formatlarina karsilik gelir (bkz. app/models/habit.py):
// gunluk "2026-10-01", haftalik "2026-W40" (ISO hafta), aylik "2026-10".
export const PERIOD_LABELS = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
  yearly: 'Yıllık',
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export function currentPeriodKey(period, date = new Date()) {
  const year = date.getFullYear();
  if (period === 'daily') {
    return `${year}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  if (period === 'weekly') {
    return `${year}-W${pad(isoWeek(date))}`;
  }
  if (period === 'monthly') {
    return `${year}-${pad(date.getMonth() + 1)}`;
  }
  return `${year}`;
}
