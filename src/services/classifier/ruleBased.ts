import type { CategoryId, ClassificationResult, ClassifyInput, ContentType } from '../../lib/types';
import { extractUrl, fuzzyWordMatch, normalize, tokenize, URL_RE } from '../../lib/hebrew';
import { extractDate } from '../../lib/dates';
import { lookupSite, titleFromPath } from '../linkPreview';
import { CATEGORY_KEYWORDS, CATEGORY_PHRASES, TAG_KEYWORDS, TASK_LEADS } from './keywords';
import type { Classifier } from './types';

type Scores = Record<CategoryId, number>;

const emptyScores = (): Scores => ({ recipes: 0, shopping: 0, ideas: 0, tasks: 0, readlater: 0, places: 0, other: 0.6 });

const LIST_PREFIX = /^\s*(רשימת קניות|קניות|לקנות|צריך לקנות|לסופר|מה חסר)\s*(ב[א-ת]+|ל[א-ת]+)?\s*[:\-–]?\s*/;

/** "לקנות חלב, ביצים ולחם" -> ["חלב", "ביצים", "לחם"] */
export function parseListItems(text: string): string[] {
  const body = text.replace(URL_RE, ' ').replace(LIST_PREFIX, '');
  let parts = body.split(/\n|,|;|،|•|\*/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 1) parts = parts[0].split(/\s+ו-?(?=[א-ת])/);
  const items = parts
    .flatMap((p) => p.split(/\s+ו-?(?=[א-ת]{2,})/))
    .map((p) =>
      p
        .replace(/^[-–•*\d.)\s]+/, '')
        .replace(/^ו-?(?=[א-ת]{2,})/, '')
        .replace(/^(גם|עוד)\s+/, '')
        .trim(),
    )
    .filter((p) => p.length >= 2 && p.length <= 40);
  return [...new Set(items)];
}

function cleanTitle(s: string, max = 56): string {
  let t = s.replace(URL_RE, '').replace(/\s+/g, ' ').trim();
  t = t.replace(/^(רעיון|רעיונות)\s*[:\-–]\s*/, (m) => (m.startsWith('רעיונות') ? 'רעיונות ' : ''));
  t = t.replace(/^(תזכורת|לא לשכוח|חשוב|משימה)\s*[:\-–]?\s*/, '');
  t = t.replace(/^[-–:\s]+|[-–:\s]+$/g, '');
  if (t.length > max) {
    const cut = t.slice(0, max);
    t = cut.slice(0, cut.lastIndexOf(' ') > 20 ? cut.lastIndexOf(' ') : max) + '…';
  }
  return t;
}

function detectTags(text: string): string[] {
  const n = ' ' + normalize(text).replace(/בית (קפה|ספר|מרקחת|כנסת|חולים)/g, '$1') + ' ';
  const tokens = n.trim().split(' ');
  const tags: string[] = [];
  for (const [tag, words] of Object.entries(TAG_KEYWORDS)) {
    const hit = words.some((w) => {
      const nw = normalize(w);
      return nw.includes(' ') ? n.includes(' ' + nw) : tokens.some((tk) => fuzzyWordMatch(tk, nw) >= 0.85);
    });
    if (hit) tags.push(tag);
  }
  return tags.slice(0, 3);
}

function urlPathSignals(url: string, scores: Scores) {
  let path = '';
  try {
    path = decodeURIComponent(new URL(url).pathname + new URL(url).search).toLowerCase();
  } catch {
    return;
  }
  if (/recipe|food|cook|bake|מתכון|pasta|cake/.test(path)) scores.recipes += 4;
  if (/restaurant|maps|place|hotel|travel|trip|מסעדה/.test(path)) scores.places += 4;
  if (/product|item|shop|\/dp\/|buy|cart|catalog/.test(path)) scores.shopping += 4;
  if (/article|news|blog|post|story|watch|\/\d{5,}/.test(path)) scores.readlater += 2;
}

export const ruleBasedClassifier: Classifier = {
  name: 'מיון מקומי חכם',
  async classify(input: ClassifyInput): Promise<ClassificationResult> {
    return classifySync(input);
  },
};

export function classifySync({ text, hint, hasImage, now = new Date() }: ClassifyInput): ClassificationResult {
  const raw = text.trim();
  const url = extractUrl(raw);
  const textOnly = raw.replace(URL_RE, ' ').trim();
  const norm = ' ' + normalize(textOnly) + ' ';
  const tokens = tokenize(textOnly);
  const scores = emptyScores();

  // 1. keywords (typo tolerant, prefix aware)
  for (const [cat, dict] of Object.entries(CATEGORY_KEYWORDS) as [CategoryId, Record<string, number>][]) {
    for (const tk of tokens) {
      let best = 0;
      for (const [kw, w] of Object.entries(dict)) {
        const m = fuzzyWordMatch(tk, kw);
        if (m) best = Math.max(best, m * w);
      }
      scores[cat] += best;
    }
  }
  // 2. phrases
  for (const [cat, dict] of Object.entries(CATEGORY_PHRASES) as [CategoryId, Record<string, number>][]) {
    for (const [ph, w] of Object.entries(dict)) if (norm.includes(' ' + normalize(ph))) scores[cat] += w;
  }
  // 3. structure
  const { date, time } = extractDate(textOnly, now);
  if (TASK_LEADS.test(textOnly)) scores.tasks += 2.5;
  if (date) scores.tasks += 2.5;
  const listItems = parseListItems(raw);
  const looksLikeList = listItems.length >= 3 && listItems.every((i) => i.split(' ').length <= 4);
  if (looksLikeList) scores.shopping += 2.5;

  // 4. links
  let linkTitle: string | undefined;
  if (url) {
    const site = lookupSite(url);
    if (site) scores[site.category] += 6;
    else scores.readlater += textOnly.length < 15 ? 3.5 : 2;
    urlPathSignals(url, scores);
    linkTitle = titleFromPath(url) ?? site?.name;
  }

  // 5. explicit hint from the composer wins, but we still return alternatives
  const hintCat: Partial<Record<ContentType, CategoryId>> = { task: 'tasks', idea: 'ideas', list: 'shopping' };
  if (hint && hintCat[hint]) scores[hintCat[hint]!] += 20;

  const ranked = (Object.entries(scores) as [CategoryId, number][]).sort((a, b) => b[1] - a[1]);
  let [category, top] = ranked[0];
  const second = ranked[1][1];
  if (top < 1.4) category = url ? 'readlater' : 'other';

  const confidence = Math.max(
    0.3,
    Math.min(0.98, category === 'other' ? 0.4 : (top - second) / (top + 2) + Math.min(top, 10) / 20 + 0.15),
  );
  const alternatives = ranked
    .map(([c]) => c)
    .filter((c) => c !== category && c !== 'other')
    .slice(0, 3);

  const isTask = category === 'tasks';
  const isShoppingList = category === 'shopping' && (hint === 'list' || listItems.length >= 2);

  // content type
  let contentType: ContentType = 'text';
  if (hasImage) contentType = 'image';
  else if (hint && hint !== 'text') contentType = hint;
  else if (url) contentType = 'link';
  else if (isTask) contentType = 'task';
  else if (isShoppingList) contentType = 'list';
  else if (category === 'ideas') contentType = 'idea';

  // title + summary
  let title: string;
  if (isShoppingList) {
    const head = listItems.slice(0, 2).join(', ');
    title =
      listItems.length > 3
        ? `קניות: ${head} ועוד ${listItems.length - 2}`
        : `קניות: ${listItems.slice(0, -1).join(', ')} ו${listItems[listItems.length - 1]}`;
  } else if (textOnly.length >= 3) {
    title = cleanTitle(textOnly.split('\n')[0]);
  } else if (url) {
    title = linkTitle ?? 'קישור ששמרת';
  } else if (hasImage) {
    title = 'צילום מסך';
  } else {
    title = cleanTitle(raw) || 'פריט חדש';
  }
  if (title.length > 0) title = title.charAt(0).toUpperCase() + title.slice(1);

  let summary = '';
  if (isShoppingList) summary = `${listItems.length} מוצרים ברשימה`;
  else if (url) summary = `קישור מ-${lookupSite(url)?.name ?? (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })()}`;
  else if (textOnly.length > title.length + 10) summary = textOnly.slice(0, 140);

  return {
    category,
    title,
    summary,
    tags: detectTags(raw),
    contentType,
    isTask,
    isShoppingList,
    listItems: isShoppingList ? listItems : [],
    dueDate: isTask ? date : undefined,
    dueTime: isTask ? time : undefined,
    url,
    confidence: Number(confidence.toFixed(2)),
    alternatives,
    engine: 'rules',
  };
}
