import type { CategoryId, Item } from '../lib/types';
import { fuzzyWordMatch, normalize, tokenize, variants } from '../lib/hebrew';
import { CATEGORY_BY_ID } from '../lib/categories';
import { daysBetween } from '../lib/dates';

/** Understanding of a natural-language query, shown back to the user as chips. */
export interface QueryIntent {
  category?: CategoryId;
  taskStatus?: 'open' | 'done';
  favorites?: boolean;
  recentDays?: number;
  tag?: string;
  terms: string[];
}

export interface SearchHit {
  item: Item;
  score: number;
  /** Words to highlight in the result */
  terms: string[];
}

const CATEGORY_WORDS: [CategoryId, string[]][] = [
  ['recipes', ['מתכון', 'מתכונים', 'לבשל', 'בישול', 'אוכל', 'לאפות']],
  ['shopping', ['לקנות', 'קניות', 'קנייה', 'לקנייה', 'רשימת', 'סופר', 'מוצרים']],
  ['ideas', ['רעיון', 'רעיונות']],
  ['tasks', ['משימה', 'משימות', 'לעשות', 'מטלות', 'תזכורות', 'תזכורת', 'סידורים']],
  ['readlater', ['כתבה', 'כתבות', 'לקרוא', 'לקריאה', 'מאמר', 'מאמרים', 'קישור', 'קישורים', 'לינק', 'לינקים', 'סרטון', 'סרטונים']],
  ['places', ['מסעדה', 'מסעדות', 'מקום', 'מקומות', 'לבקר', 'בית קפה', 'בתי קפה']],
];

const STOP = new Set(
  [
    'איפה', 'שמרתי', 'ששמרתי', 'שמרנו', 'שמור', 'שמורים', 'את', 'כל', 'הדברים', 'דברים', 'הדבר', 'רציתי', 'שרציתי', 'רוצה', 'מה', 'של',
    'על', 'עם', 'לי', 'אני', 'יש', 'זה', 'היה', 'הזה', 'הזאת', 'אותו', 'אותה', 'תמצא', 'למצוא', 'תראה', 'תביא', 'הראה', 'תן', 'מצא',
    'בבקשה', 'או', 'גם', 'שלי', 'פעם', 'ההוא', 'ההיא', 'אחד', 'אחת', 'כמה', 'עוד', 'עדיין', 'לא', 'כבר', 'ש', 'ה', 'ו', 'ב', 'ל', 'מ',
    'שם', 'מישהו', 'שעדיין', 'שעוד', 'ביצעתי', 'עשיתי', 'סיימתי', 'בוצעו', 'הושלמו', 'פתוחות', 'פתוחים', 'שנשארו', 'אמר', 'המליץ', 'שהמליצו', 'המליצו', 'ששלחתי', 'שלחתי', 'לעצמי',
  ].map(normalize),
);

const OPEN_RE = /(עדיין לא|שלא (ביצעתי|עשיתי|סיימתי)|לא (ביצעתי|עשיתי|בוצעו|הושלמו)|פתוחות|פתוחים|שנשארו|מחכות|ממתינות)/;
const DONE_RE = /(שביצעתי|שעשיתי|שסיימתי|הושלמו|שהושלמו|בוצעו|גמורות)/;

export function parseQuery(query: string, knownTags: string[] = []): QueryIntent {
  const raw = query.trim();
  const n = normalize(raw);
  const intent: QueryIntent = { terms: [] };

  if (OPEN_RE.test(raw)) intent.taskStatus = 'open';
  else if (DONE_RE.test(raw)) intent.taskStatus = 'done';
  if (/מועדפ/.test(raw)) intent.favorites = true;
  if (/(השבוע|בשבוע האחרון)/.test(raw)) intent.recentDays = 7;
  else if (/(היום)/.test(raw) && !intent.taskStatus) intent.recentDays = 1;
  else if (/(החודש|בחודש האחרון)/.test(raw)) intent.recentDays = 31;

  let rest = ' ' + n + ' ';
  for (const [cat, words] of CATEGORY_WORDS) {
    for (const w of words) {
      const nw = normalize(w);
      const tokens = rest.trim().split(' ');
      const hit = nw.includes(' ') ? rest.includes(' ' + nw + ' ') : tokens.find((t) => variants(t).includes(nw));
      if (hit) {
        intent.category ??= cat;
        rest = nw.includes(' ') ? rest.replace(' ' + nw + ' ', ' ') : (' ' + tokens.filter((t) => t !== hit).join(' ') + ' ');
      }
    }
  }
  if (intent.taskStatus && !intent.category) intent.category = 'tasks';

  for (const tag of knownTags) {
    const nt = normalize(tag);
    const tokens = rest.trim().split(' ');
    const hit = tokens.find((t) => variants(t).includes(nt));
    if (hit && !intent.tag) {
      intent.tag = tag;
      rest = ' ' + tokens.filter((t) => t !== hit).join(' ') + ' ';
    }
  }

  const cleaned = rest
    .replace(/(עדיין לא|שלא|ביצעתי|עשיתי|סיימתי|פתוחות|פתוחים|שנשארו|הושלמו|שהושלמו|מועדפים|מועדפות|מועדף|השבוע|החודש|היום|האחרון|בשבוע|בחודש)/g, ' ')
    .split(' ')
    .filter((t) => t.length >= 2 && !variants(t).some((v) => STOP.has(v)));
  intent.terms = [...new Set(cleaned)];
  return intent;
}

function fieldScore(terms: string[], text: string | undefined, weight: number, matched: Set<string>): number {
  if (!text) return 0;
  const words = tokenize(text);
  const joined = ' ' + words.join(' ') + ' ';
  let score = 0;
  for (const term of terms) {
    let best = 0;
    if (joined.includes(term)) best = 1;
    else for (const w of words) best = Math.max(best, fuzzyWordMatch(w, term), fuzzyWordMatch(term, w) * 0.9);
    if (best > 0) {
      matched.add(term);
      score += best * weight;
    }
  }
  return score;
}

export function searchItems(items: Item[], query: string, knownTags: string[] = [], now = new Date()): { intent: QueryIntent; hits: SearchHit[] } {
  const intent = parseQuery(query, knownTags);
  const { terms } = intent;

  const filtered = items.filter((it) => {
    if (intent.taskStatus && (!it.task || (intent.taskStatus === 'open') === it.task.done)) return false;
    if (intent.favorites && !it.favorite) return false;
    if (intent.recentDays && daysBetween(new Date(it.createdAt), now) >= intent.recentDays) return false;
    if (intent.tag && !it.tags.includes(intent.tag)) return false;
    return true;
  });

  const scoreAll = (pool: Item[]): SearchHit[] =>
    pool
      .map((item) => {
        if (!terms.length) return { item, score: 1, terms: [] };
        const matched = new Set<string>();
        let score =
          fieldScore(terms, item.title, 3, matched) +
          fieldScore(terms, item.tags.join(' '), 3, matched) +
          fieldScore(terms, item.link ? `${item.link.siteName} ${item.link.domain} ${item.link.title}` : undefined, 2.5, matched) +
          fieldScore(terms, item.rawText, 1.5, matched) +
          fieldScore(terms, item.summary, 1, matched) +
          fieldScore(terms, item.notes, 1.2, matched) +
          fieldScore(terms, item.checklist?.map((c) => c.text).join(' '), 1.2, matched) +
          fieldScore(terms, CATEGORY_BY_ID[item.category].name, 1, matched);
        // reward items that match more of the query words
        score *= 0.5 + matched.size / terms.length;
        return { item, score, terms: [...matched] };
      })
      .filter((h) => h.score > 0.6);

  let pool = intent.category ? filtered.filter((i) => i.category === intent.category) : filtered;
  let hits = scoreAll(pool);
  // The category guess was wrong for these words - search everywhere instead of showing nothing
  if (intent.category && terms.length && !hits.length) {
    pool = filtered;
    hits = scoreAll(pool);
  }
  // A word that looked like a tag but matched nothing as a tag - treat it as a plain word instead
  if (intent.tag && !hits.length) {
    const retry = searchItems(items, query.replace(intent.tag, ' ' + intent.tag + ' '), [], now);
    return { intent: retry.intent, hits: retry.hits };
  }
  hits.sort((a, b) => b.score - a.score || +new Date(b.item.createdAt) - +new Date(a.item.createdAt));
  return { intent, hits };
}

/** Ready-made natural-language examples shown on the empty search screen. */
export const EXAMPLE_QUERIES = [
  'איפה שמרתי את המתכון לעוגת שוקולד?',
  'כל הדברים שרציתי לקנות',
  'רעיונות לעסק',
  'המסעדה ששמרתי בתל אביב',
  'משימות שעדיין לא ביצעתי',
];
