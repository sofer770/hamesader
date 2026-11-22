/** Date helpers. All due dates are local calendar dates (YYYY-MM-DD). */
import { isEn } from './i18n';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

export const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

/** "היום", "מחר", "ביום חמישי", "12 בדצמבר" */
export function formatDue(iso: string, now = new Date()): string {
  const d = fromISODate(iso);
  const diff = daysBetween(now, d);
  if (isEn) {
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff < -1) return `${-diff} days ago`;
    if (diff < 7) return WEEKDAYS_EN[d.getDay()];
    return `${MONTHS_EN[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  }
  if (diff === 0) return 'היום';
  if (diff === 1) return 'מחר';
  if (diff === 2) return 'מחרתיים';
  if (diff === -1) return 'אתמול';
  if (diff < -1) return `לפני ${-diff} ימים`;
  if (diff < 7) return `יום ${WEEKDAYS[d.getDay()]}`;
  return `${d.getDate()} ב${MONTHS[d.getMonth()]}`;
}

/** Relative "saved" time: "לפני 5 דקות", "אתמול", "12 בנובמבר" */
export function formatSaved(isoDateTime: string, now = new Date()): string {
  const d = new Date(isoDateTime);
  const mins = Math.round((now.getTime() - d.getTime()) / 60000);
  if (isEn) {
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
    const h = Math.round(mins / 60);
    if (daysBetween(d, now) === 0) return h === 1 ? '1 hour ago' : `${h} hours ago`;
    const dd = daysBetween(d, now);
    if (dd === 1) return 'Yesterday';
    if (dd < 7) return `${dd} days ago`;
    return `${MONTHS_EN[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  }
  if (mins < 1) return 'עכשיו';
  if (mins < 60) return mins === 1 ? 'לפני דקה' : `לפני ${mins} דקות`;
  const hours = Math.round(mins / 60);
  if (daysBetween(d, now) === 0) return hours === 1 ? 'לפני שעה' : hours === 2 ? 'לפני שעתיים' : `לפני ${hours} שעות`;
  const days = daysBetween(d, now);
  if (days === 1) return 'אתמול';
  if (days === 2) return 'שלשום';
  if (days < 7) return `לפני ${days} ימים`;
  return `${d.getDate()} ב${MONTHS[d.getMonth()]}`;
}

export function formatFullDate(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  if (isEn) return `${WEEKDAYS_EN[d.getDay()]}, ${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `יום ${WEEKDAYS[d.getDay()]}, ${d.getDate()} ב${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Finds a date/deadline in free Hebrew text.
 * Supports: היום, מחר, מחרתיים, ביום ראשון..שבת / ב-ראשון, בשבוע הבא, בסוף השבוע / בסופ"ש,
 * בעוד N ימים / בעוד שבוע, 12/5, 12.5.25 and "בשעה 10" / "ב-17:30".
 */
export function extractDate(text: string, now = new Date()): { date?: string; time?: string } {
  if (!/[\u0590-\u05FF]/.test(text) && /[a-z]/i.test(text)) return extractDateEn(text, now);
  const t = text.replace(/[״"]/g, '');
  let date: Date | undefined;

  if (/מחרתיים/.test(t)) date = addDays(now, 2);
  else if (/(^|\s|ל|ב)מחר(\s|$|[,.!])/.test(t) || /^מחר/.test(t)) date = addDays(now, 1);
  else if (/(^|\s)(היום|הערב|עוד היום)(\s|$|[,.!])/.test(t)) date = now;

  if (!date) {
    const wd = t.match(/(?:ביום|יום|עד יום|ב-?)\s*(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/);
    if (wd) {
      const target = WEEKDAYS.indexOf(wd[1]);
      let diff = (target - now.getDay() + 7) % 7;
      if (diff === 0) diff = 7;
      date = addDays(now, diff);
    }
  }
  if (!date && /(סוף השבוע|סופש|סופ ש|לסופש)/.test(t)) {
    const diff = (5 - now.getDay() + 7) % 7;
    date = addDays(now, diff);
  }
  if (!date && /(שבוע הבא|בשבוע הבא)/.test(t)) {
    const diff = (7 - now.getDay()) % 7 || 7;
    date = addDays(now, diff);
  }
  if (!date) {
    const inN = t.match(/בעוד\s+(\d+|יומיים|שבוע|שבועיים|חודש)\s*(ימים|יום)?/);
    if (inN) {
      const map: Record<string, number> = { יומיים: 2, שבוע: 7, שבועיים: 14, חודש: 30 };
      const n = map[inN[1]] ?? Number(inN[1]);
      if (!Number.isNaN(n)) date = addDays(now, n);
    }
  }
  if (!date) {
    const dm = t.match(/(?:^|\s|ב-?|עד\s)(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?(?=\s|$|[,.!])/);
    if (dm) {
      const day = Number(dm[1]);
      const month = Number(dm[2]) - 1;
      let year = dm[3] ? Number(dm[3]) : now.getFullYear();
      if (year < 100) year += 2000;
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        date = new Date(year, month, day);
        if (!dm[3] && daysBetween(now, date) < -30) date = new Date(year + 1, month, day);
      }
    }
  }

  let time: string | undefined;
  const tm = t.match(/(?:בשעה|ב-?|ל-?|עד)\s*(\d{1,2}):(\d{2})/) ?? t.match(/(\d{1,2}):(\d{2})/);
  if (tm) time = `${pad(Number(tm[1]))}:${tm[2]}`;
  else {
    const th = t.match(/בשעה\s+(\d{1,2})(?!\d)/);
    if (th) {
      let h = Number(th[1]);
      if (h >= 1 && h <= 7 && !/בבוקר/.test(t)) h += 12;
      time = `${pad(h)}:00`;
    }
  }
  return { date: date ? toISODate(date) : undefined, time };
}

/**
 * English: today, tonight, tomorrow, the day after tomorrow, (on/by/next) Monday..Sunday, this weekend,
 * next week, in N days / in a week / in 2 weeks / in a month, 12/5 (day/month), "at 10", "at 5pm", "17:30".
 */
function extractDateEn(text: string, now: Date): { date?: string; time?: string } {
  const t = ` ${text.toLowerCase()} `;
  let date: Date | undefined;
  if (/day after tomorrow/.test(t)) date = addDays(now, 2);
  else if (/\b(tomorrow|tmrw|tmr)\b/.test(t)) date = addDays(now, 1);
  else if (/\b(today|tonight|this evening)\b/.test(t)) date = now;
  if (!date) {
    const wd = t.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/);
    if (wd) {
      const target = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(wd[1].slice(0, 3));
      let diff = (target - now.getDay() + 7) % 7;
      if (diff === 0) diff = 7;
      date = addDays(now, diff);
    }
  }
  if (!date && /\b(this weekend|the weekend|weekend)\b/.test(t)) date = addDays(now, (5 - now.getDay() + 7) % 7);
  if (!date && /\bnext week\b/.test(t)) date = addDays(now, (7 - now.getDay()) % 7 || 7);
  if (!date) {
    const inN = t.match(/\bin\s+(\d+|a|one|two|three)\s+(days?|weeks?|months?)\b/);
    if (inN) {
      const words: Record<string, number> = { a: 1, one: 1, two: 2, three: 3 };
      const n = words[inN[1]] ?? Number(inN[1]);
      const unit = inN[2].startsWith('week') ? 7 : inN[2].startsWith('month') ? 30 : 1;
      if (!Number.isNaN(n)) date = addDays(now, n * unit);
    }
  }
  if (!date) {
    const dm = t.match(/(?:^|\s|on\s|by\s)(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?(?=\s|$|[,.!])/);
    if (dm) {
      const day = Number(dm[1]);
      const month = Number(dm[2]) - 1;
      let year = dm[3] ? Number(dm[3]) : now.getFullYear();
      if (year < 100) year += 2000;
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        date = new Date(year, month, day);
        if (!dm[3] && daysBetween(now, date) < -30) date = new Date(year + 1, month, day);
      }
    }
  }
  let time: string | undefined;
  const tm = t.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
  if (tm) {
    let h = Number(tm[1]);
    if (tm[3] === 'pm' && h < 12) h += 12;
    if (tm[3] === 'am' && h === 12) h = 0;
    time = `${pad(h)}:${tm[2]}`;
  } else {
    const th = t.match(/\bat\s+(\d{1,2})\s*(am|pm)?\b/) ?? t.match(/\b(\d{1,2})\s*(am|pm)\b/);
    if (th) {
      let h = Number(th[1]);
      if (th[2] === 'pm' && h < 12) h += 12;
      else if (th[2] === 'am' && h === 12) h = 0;
      else if (!th[2] && h >= 1 && h <= 7 && !/morning/.test(t)) h += 12;
      if (h <= 23) time = `${pad(h)}:00`;
    }
  }
  return { date: date ? toISODate(date) : undefined, time };
}
