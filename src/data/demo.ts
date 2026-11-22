import type { Item, TaskInfo } from '../lib/types';
import { classifySync } from '../services/classifier/ruleBased';
import { localLinkPreview } from '../services/linkPreview';
import { addDays, toISODate } from '../lib/dates';
import { uid } from '../services/storage';
import { isEn } from '../lib/i18n';

type Seed = Partial<Omit<Item, 'task'>> & {
  text: string;
  /** minutes ago */
  ago: number;
  task?: Partial<TaskInfo> & { dueIn?: number };
  checked?: string[];
  /** turn the text into a checklist */
  list?: boolean;
};

const H = 60;
const D = 24 * 60;

const SEEDS: Seed[] = [
  { text: 'הספר של יובל נח הררי שדיברנו עליו בארוחת שישי', ago: 25, reviewed: false, category: 'other', confidence: 0.42 },
  {
    text: 'לסופר: חלב, ביצים, לחם, עגבניות, קוטג׳, בננות, נייר טואלט',
    ago: 55,
    reviewed: false,
    list: true,
    title: 'רשימה לסופר',
    checked: ['חלב', 'לחם'],
    tags: ['בית'],
  },
  {
    text: 'מתכון ללזניה ירקות עם תרד ועדשים לסוף השבוע https://www.foody.co.il/foody_recipe/vegetable-lentil-lasagna',
    ago: 3 * H,
    reviewed: false,
    favorite: true,
    tags: ['משפחה'],
    title: 'לזניה ירקות עם תרד ועדשים',
    link: {
      url: 'https://www.foody.co.il/foody_recipe/vegetable-lentil-lasagna',
      domain: 'foody.co.il',
      siteName: 'Foody',
      title: 'לזניה ירקות ביתית עם תרד ועדשים',
      description: 'שכבות של רוטב עגבניות ועדשים, תרד טרי, חצילים קלויים ועשבי תיבול. מספיק ל-8 סועדים, אפשר להכין יום מראש.',
      cover: 'food',
    },
  },
  {
    text: 'לקבוע תור לרופא שיניים לילדים',
    ago: 2 * D + 6 * H,
    task: { dueIn: 0, priority: 'medium', reminderAt: 'today17' },
    tags: ['משפחה', 'בריאות'],
  },
  {
    text: 'רעיון - ליצור מדריך דיגיטלי לבעלי עסקים: איך לבנות נוכחות באינסטגרם ב-30 יום',
    ago: 8 * H,
    favorite: true,
    title: 'מדריך דיגיטלי לבעלי עסקים',
    notes: 'להתחיל מ-5 פרקים קצרים, כל פרק עם משימה מעשית. לבדוק מחיר השקה של 79 ש״ח.',
    tags: ['עסק'],
  },
  {
    text: 'מסעדה איטלקית מומלצת בתל אביב - פסטה טרייה שעושים במקום, חובה להזמין שולחן מראש https://maps.app.goo.gl/trattoria-rothschild',
    ago: 1 * D + 2 * H,
    favorite: true,
    title: 'מסעדה איטלקית מומלצת בתל אביב',
    tags: ['זוגיות'],
    link: {
      url: 'https://maps.app.goo.gl/trattoria-rothschild',
      domain: 'maps.app.goo.gl',
      siteName: 'Google Maps',
      title: 'טרטוריה ברוטשילד · שדרות רוטשילד, תל אביב',
      description: 'מסעדה איטלקית · ★ 4.7 · פתוח עד 23:30',
      cover: 'map',
    },
  },
  { text: 'לקנות מטען חדש לאייפון, כזה עם כבל ארוך', ago: 1 * D + 5 * H, title: 'מטען חדש לאייפון' },
  {
    text: 'כתבה על כלי AI חדשים https://www.geektime.co.il/ai-tools-for-small-business',
    ago: 1 * D + 9 * H,
    tags: ['עסק', 'עבודה'],
    title: 'כתבה על כלי AI חדשים',
    link: {
      url: 'https://www.geektime.co.il/ai-tools-for-small-business',
      domain: 'geektime.co.il',
      siteName: 'גיקטיים',
      title: '10 כלי AI שכל עסק קטן צריך להכיר ב-2026',
      description: 'מכתיבת פוסטים ועד מענה ללקוחות בוואטסאפ: הכלים שחוסכים שעות עבודה בשבוע.',
      cover: 'news',
    },
  },
  { text: 'לשלם ארנונה לפני שמגיע הקנס', ago: 2 * D, task: { dueIn: 3, priority: 'high' }, tags: ['בית'] },
  {
    text: 'שקשוקה עם פטה וחצילים קלויים https://www.10dakot.co.il/recipe/shakshuka-feta-eggplant',
    ago: 2 * D + 4 * H,
    title: 'שקשוקה עם פטה וחצילים',
    link: {
      url: 'https://www.10dakot.co.il/recipe/shakshuka-feta-eggplant',
      domain: '10dakot.co.il',
      siteName: '10 דקות',
      title: 'שקשוקה עם פטה וחצילים קלויים',
      description: 'ארוחת בוקר של שבת במחבת אחת. 25 דקות מההתחלה ועד הניגוב.',
      cover: 'food',
    },
  },
  {
    text: 'רעיונות לחופשה באיטליה: טוסקנה באביב, אגם קומו, יום שלם בבולוניה רק בשביל האוכל',
    ago: 3 * D,
    tags: ['טיול'],
    category: 'ideas',
    title: 'רעיונות לחופשה באיטליה',
  },
  { text: 'מתנה ליום הולדת של נועה - אוזניות אלחוטיות או ספר בישול', ago: 4 * D + 3 * H, category: 'shopping', tags: ['מתנה', 'משפחה'], title: 'מתנה ליום הולדת של נועה' },
  {
    text: 'עוגת שוקולד של סבתא רחל\n200 גרם שוקולד מריר, 4 ביצים, כוס סוכר, חצי כוס קמח, 150 גרם חמאה.\n25 דקות בתנור על 180 מעלות.',
    ago: 5 * D,
    favorite: true,
    tags: ['משפחה'],
    title: 'עוגת שוקולד של סבתא רחל',
    category: 'recipes',
  },
  { text: 'להזמין טכנאי למזגן בסלון', ago: 5 * D + 6 * H, task: { done: true, doneAt: 'ago2d', priority: 'medium' }, tags: ['בית'] },
  {
    text: 'שינה טובה יותר: 7 הרגלים פשוטים https://www.ynet.co.il/health/article/better-sleep-habits',
    ago: 6 * D,
    tags: ['בריאות'],
    title: 'שינה טובה יותר: 7 הרגלים פשוטים',
    link: {
      url: 'https://www.ynet.co.il/health/article/better-sleep-habits',
      domain: 'ynet.co.il',
      siteName: 'ynet',
      title: 'שינה טובה יותר: 7 הרגלים פשוטים שאפשר להתחיל הערב',
      description: 'מה קורה לגוף כשאנחנו נרדמים מול מסך, ולמה שעה קבועה חשובה יותר ממספר השעות.',
      cover: 'news',
    },
  },
  { text: 'מעיין עין חרדלית - שווה לבקר בחורף, מסלול קצר שמתאים לילדים', ago: 8 * D, tags: ['טיול', 'משפחה'], title: 'מעיין עין חרדלית' },
  { text: 'פודקאסט על עסקים קטנים בפריפריה - לראיין בעלי עסקים מהצפון', ago: 9 * D, tags: ['עסק'], category: 'ideas' },
  {
    text: 'הרצאה מעולה על בניית הרגלים https://www.youtube.com/watch?v=habits-talk',
    ago: 10 * D,
    title: 'הרצאה מעולה על בניית הרגלים',
    link: {
      url: 'https://www.youtube.com/watch?v=habits-talk',
      domain: 'youtube.com',
      siteName: 'YouTube',
      title: 'איך בונים הרגל שנשאר - הרצאה מלאה',
      description: '48 דקות · על שינויים קטנים שמצטברים לשינוי גדול',
      cover: 'video',
    },
  },
  { text: 'בית קפה חמוד ביפו שדנה המליצה עליו, יש שם עוגת גבינה מטורפת', ago: 12 * D, title: 'בית קפה ביפו שדנה המליצה', category: 'places' },
  { text: 'קוד לשער בבניין של ההורים: 4521#', ago: 20 * D, tags: ['משפחה'], category: 'other', title: 'קוד לשער אצל ההורים' },
  { text: 'מספר פוליסה של ביטוח הדירה: 77-845120', ago: 30 * D, tags: ['בית'], category: 'other', title: 'מספר פוליסה - ביטוח דירה' },
];


/** English version: one example per category. */
const SEEDS_EN: Seed[] = [
  {
    text: 'Vegetable lentil lasagna with spinach for the weekend https://www.bbcgoodfood.com/recipes/vegetable-lentil-lasagne',
    ago: 3 * H,
    reviewed: false,
    favorite: true,
    category: 'recipes',
    tags: ['family'],
    title: 'Vegetable lentil lasagna with spinach',
    link: {
      url: 'https://www.bbcgoodfood.com/recipes/vegetable-lentil-lasagne',
      domain: 'bbcgoodfood.com',
      siteName: 'BBC Good Food',
      title: 'Homemade vegetable lasagna with spinach and lentils',
      description: 'Layers of tomato and lentil sauce, fresh spinach, roasted eggplant and herbs. Serves 8 and can be made a day ahead.',
      cover: 'food',
    },
  },
  {
    text: 'Groceries: milk, eggs, bread, tomatoes, bananas, toilet paper',
    ago: 55,
    reviewed: false,
    list: true,
    category: 'shopping',
    title: 'Grocery list',
    checked: ['milk', 'bread'],
    tags: ['home'],
  },
  {
    text: 'Idea - a digital guide for small business owners: building an Instagram presence in 30 days',
    ago: 8 * H,
    favorite: true,
    category: 'ideas',
    title: 'Digital guide for business owners',
    notes: 'Start with 5 short chapters, each with a practical task. Check a launch price of $25.',
    tags: ['business'],
  },
  {
    text: 'Book a dentist appointment for the kids',
    ago: 2 * D + 6 * H,
    category: 'tasks',
    task: { dueIn: 0, priority: 'medium', reminderAt: 'today17' },
    tags: ['family', 'health'],
  },
  {
    text: 'Article about the benefits of a short walk after meals https://www.healthline.com/nutrition/walking-after-eating',
    ago: 1 * D,
    category: 'readlater',
    tags: ['health'],
    title: 'Why a short walk after meals helps',
  },
  { text: 'Cute cafe in the old town that Dana recommended, amazing carrot cake', ago: 4 * D, category: 'places', title: 'Cafe Dana recommended' },
  { text: 'Gate code at my parents building: 4521#', ago: 20 * D, tags: ['family'], category: 'other', title: 'Gate code at my parents' },
];

export const HE_DEMO_TEXTS = new Set(SEEDS.map((s) => s.text));
export const EN_DEMO_TEXTS = new Set(SEEDS_EN.map((s) => s.text));

/** Language switched while the phone still holds only the other language's untouched examples: show this language's examples. */
export function swapDemoLang(items: Item[]): Item[] {
  const other = isEn ? HE_DEMO_TEXTS : EN_DEMO_TEXTS;
  if (!items.length || !items.every((i) => other.has(i.rawText))) return items;
  return buildDemoItems();
}

export function buildDemoItems(now = new Date()): Item[] {
  return (isEn ? SEEDS_EN : SEEDS).map((s) => {
    const created = new Date(now.getTime() - s.ago * 60_000);
    const r = classifySync({ text: s.text, now: created });
    const category = s.category ?? (s.task ? 'tasks' : r.category);
    const isTask = category === 'tasks';
    const listItems = s.list ? r.listItems : [];
    let task: TaskInfo | undefined;
    let reminderAt: string | undefined;
    if (isTask) {
      const t = s.task ?? {};
      if (t.reminderAt === 'today17') {
        const d = new Date(now);
        d.setHours(17, 0, 0, 0);
        reminderAt = d.toISOString();
      }
      task = {
        done: t.done ?? false,
        doneAt: t.doneAt ? addDays(now, -Number(t.doneAt.replace(/\D/g, ''))).toISOString() : undefined,
        dueDate: t.dueIn !== undefined ? toISODate(addDays(now, t.dueIn)) : r.dueDate,
        dueTime: t.dueTime ?? r.dueTime,
        priority: t.priority ?? 'medium',
      };
    }
    const url = r.url;
    return {
      id: uid(),
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
      rawText: s.text,
      title: s.title ?? r.title,
      summary: s.link?.description ?? r.summary,
      category,
      contentType: url ? 'link' : isTask ? 'task' : listItems.length ? 'list' : category === 'ideas' ? 'idea' : 'text',
      url,
      link: s.link ?? undefined,
      tags: s.tags ?? r.tags,
      notes: s.notes ?? '',
      favorite: s.favorite ?? false,
      reviewed: s.reviewed ?? true,
      confidence: s.confidence ?? r.confidence,
      task,
      reminderAt,
      reminderFired: reminderAt ? new Date(reminderAt).getTime() <= now.getTime() : undefined,
      checklist: listItems.length ? listItems.map((text) => ({ id: uid(), text, checked: s.checked?.includes(text) ?? false })) : undefined,
    } satisfies Item;
  });
}

// Fill previews for any seeded link without a hand-written one (kept async-compatible with a real service)
export async function hydrateLinks(items: Item[]): Promise<Item[]> {
  return Promise.all(items.map(async (it) => (it.url && !it.link ? { ...it, link: await localLinkPreview.preview(it.url) } : it)));
}

/** Demo items removed in later versions - cleaned from phones that already loaded the old demo. */
const RETIRED_DEMO = new Set([
  'מתכון ללזניה בשרית לסוף השבוע https://www.foody.co.il/foody_recipe/lasagna-bolognese',
  'לקבוע פגישה עם רואה החשבון לגבי הדוח השנתי',
  'להחזיר את הספר לספרייה העירונית',
  'לשלוח הצעת מחיר ללקוח מחיפה',
  'לחדש ביטוח רכב',
]);

export function upgradeDemo(items: Item[]): Item[] {
  if (!items.some((i) => RETIRED_DEMO.has(i.rawText))) return items;
  const fresh = buildDemoItems();
  return items.flatMap((i) => {
    if (!RETIRED_DEMO.has(i.rawText)) return [i];
    if (i.rawText.includes('lasagna-bolognese')) {
      const veg = fresh.find((f) => f.rawText.includes('vegetable-lentil-lasagna'));
      return veg ? [{ ...veg, id: i.id, createdAt: i.createdAt, favorite: i.favorite }] : [];
    }
    return [];
  });
}
