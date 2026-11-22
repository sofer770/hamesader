/**
 * Hebrew / English. The language is chosen once at startup (saved setting, or ?lang=en in the link),
 * so plain helpers (dates, classifier) can use it too. Switching language reloads the app.
 */
export type Lang = 'he' | 'en';

const SETTINGS_KEY = 'hamesader.settings.v1';

function detect(): Lang {
  try {
    const p = new URLSearchParams(location.search).get('lang');
    if (p === 'en' || p === 'he') {
      save(p);
      return p;
    }
  } catch {
    /* ignore */
  }
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
    if (s?.lang === 'en' || s?.lang === 'he') return s.lang;
  } catch {
    /* ignore */
  }
  return 'he';
}

function save(l: Lang) {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') ?? {};
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...s, lang: l }));
  } catch {
    /* ignore */
  }
}

export const lang: Lang = detect();
export const isEn = lang === 'en';
export const dir = isEn ? 'ltr' : 'rtl';
export const locale = isEn ? 'en-US' : 'he-IL';

/** Pick the text for the current language: L('שמירה', 'Save') */
export const L = (he: string, en: string) => (isEn ? en : he);

/** Plural helper: n === 1 ? one : many */
export const plural = (n: number, he1: string, heN: string, en1: string, enN: string) => (n === 1 ? L(he1, en1) : L(heN, enN));

export function setLang(l: Lang) {
  save(l);
  try {
    const url = new URL(location.href);
    url.searchParams.delete('lang');
    location.replace(url.toString());
  } catch {
    location.reload();
  }
}

export const APP_NAME = L('המסדר', 'Hamesader');
