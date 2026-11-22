/** Hebrew text helpers shared by the classifier and the search engine. */

const NIQQUD = /[֑-ׇ]/g;
const FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

/** Lowercase, strip niqqud/punctuation, unify final letters and geresh variants. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(NIQQUD, '')
    .replace(/[״"׳']/g, '')
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(s: string): string[] {
  return normalize(s).split(' ').filter(Boolean);
}

/** Common one-letter prefixes (ו, ה, ב, ל, מ, ש, כ) and their two-letter combos. */
const PREFIXES = ['וכש', 'ושה', 'וה', 'וב', 'ול', 'ומ', 'וש', 'שה', 'שב', 'של', 'שמ', 'מה', 'לה', 'בה', 'כש', 'ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ'];

/** Returns the token plus plausible stems with Hebrew prefixes / simple plural suffixes removed. */
export function variants(token: string): string[] {
  const out = new Set<string>([token]);
  // English: simple plural / verb endings (recipes -> recipe, buying -> buy, cookies -> cooky/cookie)
  if (/^[a-z]+$/.test(token)) {
    if (token.length > 4 && token.endsWith('ies')) out.add(token.slice(0, -3) + 'y');
    if (token.length > 4 && token.endsWith('es')) out.add(token.slice(0, -2));
    if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) out.add(token.slice(0, -1));
    if (token.length > 5 && token.endsWith('ing')) out.add(token.slice(0, -3));
    if (token.length > 4 && token.endsWith('ed')) out.add(token.slice(0, -2));
    return [...out];
  }
  for (const p of PREFIXES) {
    if (token.startsWith(p) && token.length - p.length >= 2) out.add(token.slice(p.length));
  }
  for (const t of [...out]) {
    for (const suf of ['ים', 'ות', 'יות', 'ה', 'ת', 'י']) {
      if (t.endsWith(suf) && t.length - suf.length >= 2) out.add(t.slice(0, -suf.length));
    }
  }
  return [...out];
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Typo-tolerant word match: exact stem, prefix match, or 1 edit for words of 4+ letters. */
export function fuzzyWordMatch(word: string, keyword: string): number {
  const kw = normalize(keyword);
  const vs = variants(word);
  if (vs.includes(kw)) return 1;
  let best = 0;
  for (const v of vs) {
    if (kw.length >= 3 && v.startsWith(kw) && v.length - kw.length <= 3) best = Math.max(best, 0.85);
    else if (kw.length >= 4 && v.length >= 4 && Math.abs(v.length - kw.length) <= 1 && levenshtein(v, kw) <= 1) best = Math.max(best, 0.7);
  }
  return best;
}

export const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+\.(?:co\.il|org\.il|com|net|org|io|co|il|app|ly|me)(?:\/[^\s]*)?)/i;

export function extractUrl(text: string): string | undefined {
  const m = text.match(URL_RE);
  if (!m) return undefined;
  let u = m[0].replace(/[),.!?]+$/, '');
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}
