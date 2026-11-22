# המסדר

אפליקציה שמרכזת את כל מה ששומרים לעצמנו ("הודעות לעצמי" בוואטסאפ), ממיינת אוטומטית לקטגוריות ומאפשרת למצוא כל דבר בחיפוש בעברית.

## הרצה

```bash
npm install
npm run dev            # פיתוח מקומי
npm run build          # בנייה לפריסה (תיקיית dist)
npm run build:single   # קובץ HTML יחיד לתצוגה מקדימה (dist-single)
npm test               # בדיקות הסיווג והחיפוש
```

לפני פריסה: לכתוב ב-`.env` את כתובת האתר, למשל `VITE_SITE_URL=https://hamesader.co.il`,
כדי שתמונת השיתוף (הלוגו) תופיע כשמשתפים קישור בוואטסאפ ובפייסבוק.

## Stack

React 18 + TypeScript + Vite + Tailwind CSS, אייקונים lucide-react. נבחר Vite ולא Next.js כי ב-MVP אין צורך בשרת,
והוא נותן גם בנייה רגילה לפריסה (Vercel / Netlify / Cloudflare Pages) וגם קובץ יחיד לתצוגה מקדימה.
מעבר ל-Next.js בהמשך פשוט: כל הקוד בתיקיות `screens`, `components`, `services` עובר כמו שהוא.

## מבנה

```
src/
  lib/            טיפוסים, קטגוריות, עזרי עברית ותאריכים
  services/
    classifier/   ממשק Classifier + מנוע חוקים בעברית + לקוח AI בצד שרת
    search.ts     חיפוש בשפה טבעית (כוונה, קטגוריה, תגיות, שגיאות כתיב)
    linkPreview.ts תצוגה מקדימה לקישורים (ממשק להחלפה בשירות שרת)
    storage.ts    ממשק ItemsRepository (כרגע localStorage, מוכן ל-Supabase)
  data/demo.ts    נתוני דוגמה בעברית, עם תאריכים יחסיים להיום
  state/          store (פריטים, הגדרות, הודעות) וניווט
  components/     רכיבי UI משותפים
  screens/        בית, חיפוש, קטגוריות, משימות, קניות, פריט, תיבת קליטה, פרופיל
```

## חיבור AI אמיתי

כל המסכים מדברים רק עם הממשק `Classifier` (`src/services/classifier/types.ts`), שמחזיר
`ClassificationResult`: קטגוריה, כותרת, תקציר, תגיות, סוג תוכן, האם משימה, האם רשימת קניות, מוצרים, תאריך יעד ו-confidence.

כדי לעבור למודל AI:
1. ליצור endpoint בשרת (`POST /api/classify`) שמקבל `{ text, hint, hasImage, now }`, קורא למודל עם מפתח ה-API ששמור **בשרת בלבד**, ומחזיר JSON במבנה `ClassificationResult`.
2. להגדיר `VITE_CLASSIFIER=remote` (ואם צריך `VITE_CLASSIFIER_URL`).

אם השרת לא עונה תוך 2.5 שניות, האפליקציה חוזרת אוטומטית למנוע החוקים המקומי.

## Supabase

לממש את `ItemsRepository` מול טבלת `items` (עמודות לפי הטיפוס `Item` ב-`src/lib/types.ts`) עם RLS לפי `user_id`,
ותמונות ב-Storage במקום data URL.

## שיתוף מהטלפון

`public/manifest.webmanifest` מגדיר `share_target`: אחרי התקנה למסך הבית (Android), אפשר לשתף מוואטסאפ ישירות ל"המסדר",
והתוכן נפתח מוכן לשמירה.

---
נוצר ע"י יאיר גלעדי · המרכז לבריאות טבעית © · 054-2135831 - https://el-habriut.co.il
