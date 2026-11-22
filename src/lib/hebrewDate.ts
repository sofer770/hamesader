/** Today's date in Hebrew: Gregorian ("יום ראשון, 22 בנובמבר 2026") and Hebrew calendar ("י״ב בכסלו תשפ״ז"). */

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];

/** 12 -> י״ב, 15 -> ט״ו, 787 -> תשפ״ז */
export function gematria(n: number): string {
  let s = HUNDREDS[Math.floor(n / 100) % 10];
  const rest = n % 100;
  if (rest === 15) s += 'טו';
  else if (rest === 16) s += 'טז';
  else s += TENS[Math.floor(rest / 10)] + ONES[rest % 10];
  return s.length === 1 ? s + '׳' : s.slice(0, -1) + '״' + s.slice(-1);
}

export function gregorianToday(d = new Date()): string {
  return new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export function hebrewToday(d = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('he-IL-u-ca-hebrew-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    const day = parseInt(get('day'), 10);
    const year = parseInt(get('year').replace(/\D/g, ''), 10);
    const month = get('month');
    if (!day || !year || !month) return '';
    return `${gematria(day)} ב${month} ${gematria(year % 1000)}`;
  } catch {
    return '';
  }
}
