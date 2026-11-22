import { classifySync, parseListItems } from '../src/services/classifier/ruleBased';
import { extractDate } from '../src/lib/dates';
import { searchItems } from '../src/services/search';
import { buildDemoItems } from '../src/data/demo';

const now = new Date(2026, 10, 22, 9, 0); // Sunday
const cases: [string, string][] = [
  ['https://www.foody.co.il/foody_recipe/creamy-mushroom-pasta', 'recipes'],
  ['לקנות חלב, ביצים ולחם', 'shopping'],
  ['רעיון לפתוח פודקאסט על עסקים', 'ideas'],
  ['לקבוע תור לרופא ביום ראשון', 'tasks'],
  ['https://www.ynet.co.il/digital/technews/article/abc123', 'readlater'],
  ['https://maps.app.goo.gl/xyz מסעדה איטלקית מומלצת בתל אביב', 'places'],
  ['מתכון ללזניה בשרית לסוף השבוע', 'recipes'],
  ['לקנות מטען חדש לאייפון', 'shopping'],
  ['רעיון – ליצור מדריך דיגיטלי לבעלי עסקים', 'ideas'],
  ['לקבוע פגישה עם רואה החשבון', 'tasks'],
  ['מסעדה איטלקית מומלצת בתל אביב', 'places'],
  ['כתבה על כלי AI חדשים https://www.geektime.co.il/ai-tools-2026', 'readlater'],
  ['רעיונות לחופשה באיטליה', 'ideas'],
  ['לא לשכוח להתקשר לאמא מחר', 'tasks'],
  ['מתכון לעוגת שוקולד של סבתא', 'recipes'],
  ['מתקון לעוגת גבינה', 'recipes'], // typo
  ['עגבניות\nמלפפונים\nקוטג׳\nנייר טואלט', 'shopping'],
  ['לשלם ארנונה עד 30/11', 'tasks'],
  ['בית קפה חמוד ביפו שווה לבקר', 'places'],
  ['סרטון שווה צפייה https://youtu.be/abc', 'readlater'],
  ['קוד של השער: 4521#', 'other'],
];
let fail = 0;
for (const [t, exp] of cases) {
  const r = classifySync({ text: t, now });
  const ok = r.category === exp;
  if (!ok) fail++;
  console.log(ok ? 'PASS' : 'FAIL', `[${r.category} ${r.confidence}]`, t.replace(/\n/g, ' | '), '=>', r.title, r.dueDate ?? '', r.tags.join(','), r.listItems.join('|'));
}
console.log(parseListItems('לקנות חלב, ביצים ולחם'));
console.log(extractDate('לקבוע תור לרופא ביום ראשון', now), extractDate('מחר בשעה 10', now), extractDate('עד 30/11', now));

// search over the demo data
const demo = buildDemoItems(now);
const searches: [string, (titles: string[]) => boolean][] = [
  ['איפה שמרתי את המתכון לעוגת שוקולד?', (t) => t[0]?.includes('עוגת שוקולד')],
  ['כל הדברים שרציתי לקנות', (t) => t.length >= 3 && t.some((x) => x.includes('מטען'))],
  ['רעיונות לעסק', (t) => t[0]?.includes('מדריך') || t[0]?.includes('פודקאסט')],
  ['המסעדה ששמרתי בתל אביב', (t) => t[0]?.includes('מסעדה איטלקית')],
  ['משימות שעדיין לא ביצעתי', (t) => t.length === 5],
  ['foody', (t) => t.some((x) => x.includes('לזניה'))],
  ['ynet', (t) => t.some((x) => x.includes('שינה'))],
  ['לזנייה', (t) => t.some((x) => x.includes('לזניה'))], // typo
  ['עסק', (t) => t.length >= 4],
];
for (const [q, check] of searches) {
  const { hits, intent } = searchItems(demo, q, ['עבודה', 'בית', 'משפחה', 'טיול', 'מתנה', 'עסק']);
  const titles = hits.map((h) => h.item.title);
  const ok = !!check(titles);
  if (!ok) fail++;
  console.log(ok ? 'PASS' : 'FAIL', 'search:', q, JSON.stringify({ c: intent.category, s: intent.taskStatus, tag: intent.tag, terms: intent.terms }), '=>', titles.slice(0, 4).join(' / '));
}
console.log(fail ? `${fail} failed` : 'all passed');
process.exit(fail ? 1 : 0);
