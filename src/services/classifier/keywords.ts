import type { CategoryId } from '../../lib/types';

/** keyword -> weight. Words are matched with prefix stripping and typo tolerance. */
export const CATEGORY_KEYWORDS: Record<Exclude<CategoryId, 'other'>, Record<string, number>> = {
  recipes: {
    // English
    recipe: 5, recipes: 5, cook: 3, cooking: 3, bake: 3, baking: 3, cake: 3, cookies: 3, pasta: 3, lasagna: 3, soup: 2.5, salad: 2, stew: 3, curry: 3, dessert: 3, sauce: 2, ingredients: 4, oven: 2, pan: 1.5, quinoa: 3, lentil: 3, lentils: 3, tahini: 2, vegan: 2, vegetarian: 2, smoothie: 2.5, chocolate: 1.5, flour: 2, pancakes: 3, hummus: 1.5, dinner: 1.5, breakfast: 1.5, lunch: 1.5, bread: 1, granola: 2.5, muffins: 3, tbsp: 3, tsp: 3, cups: 1.5,
    מתכון: 5, מתכונים: 5, לבשל: 3, בישול: 3, לאפות: 3, אפייה: 3, עוגה: 3, עוגת: 3, עוגיות: 3, פסטה: 3,
    לזניה: 3, שקשוקה: 3, מרק: 2.5, סלט: 2, פשטידה: 3, עדשים: 3, תבשיל: 3, קינוח: 3, רוטב: 2, ממולאים: 3,
    חלה: 2, בורקס: 3, קוסקוס: 2.5, ריזוטו: 3, מאפה: 2.5, מצרכים: 4, הכנה: 1.5, תנור: 2, מחבת: 2, קינואה: 3,
    טחינה: 2, קטניות: 2.5, טבעוני: 2, צמחוני: 2, שייק: 2.5, שוקולד: 1.5, קמח: 1.5, פנקייק: 3, חביתה: 2.5, מוקפץ: 3, חומוס: 1.5,
    פלאפל: 1.5, 'ג׳חנון': 3, מלוואח: 3, סופגניות: 3, ארוחה: 1.5, ארוחת: 1.5, שבת: 0.5, ביסקוויטים: 2,
  },
  shopping: {
    // English
    buy: 5, shopping: 5, groceries: 5, grocery: 4, supermarket: 3, order: 1.5, sale: 2, discount: 2, coupon: 2, milk: 2, eggs: 2, bananas: 2, tomatoes: 2, cucumbers: 2, apples: 1.5, rice: 1, oil: 1, sugar: 1, toilet: 2, detergent: 2, shampoo: 2, soap: 1.5, diapers: 2, charger: 2.5, headphones: 2.5, cable: 2, batteries: 2, shoes: 2, shirt: 1.5, jacket: 1.5, price: 1.5, product: 1.5, store: 1.5, need: 0.5,
    לקנות: 5, קניות: 5, קנייה: 3, סופר: 3, להזמין: 1.5, מבצע: 2, הנחה: 2, קופון: 2, חלב: 2, ביצים: 2, לחם: 2,
    קוטג: 2, גבינה: 1.5, עגבניות: 2, מלפפונים: 2, בננות: 2, תפוחים: 1.5, אורז: 1, שמן: 1, סוכר: 1, קפה: 0.5,
    טואלט: 2, כביסה: 1, אבקת: 1.5, מרכך: 1.5, שמפו: 2, סבון: 1.5, חיתולים: 2, מטען: 2.5, אוזניות: 2.5,
    כבל: 2, סוללות: 2, נעליים: 2, חולצה: 1.5, מכנסיים: 1.5, מעיל: 1.5, מקרר: 1.5, שואב: 1.5, חסר: 1.5,
    נגמר: 2, שופרסל: 3, רמי: 1, יוחננוף: 3, ויקטורי: 2, מחיר: 1.5, שקל: 1, 'ש״ח': 1, מוצר: 1.5, להחליף: 0.5,
  },
  ideas: {
    // English
    idea: 5, ideas: 5, maybe: 1.5, worth: 0.5, think: 1.5, dream: 2, project: 2, startup: 3, podcast: 2.5, guide: 1.5, blog: 2, channel: 1.5, concept: 3, inspiration: 3, cool: 1.5, initiative: 2, venture: 3, app: 1.5, business: 1.5, start: 1, create: 1.5, write: 1, book: 0.5, course: 1.5, workshop: 1.5, content: 1, webinar: 1.5, campaign: 1.5,
    רעיון: 5, רעיונות: 5, אולי: 1.5, כדאי: 1, לחשוב: 2, חלום: 2, פרויקט: 2, סטארטאפ: 3, פודקאסט: 2.5,
    מדריך: 1.5, בלוג: 2, ערוץ: 1.5, קונספט: 3, השראה: 3, מגניב: 1.5, יוזמה: 2, מיזם: 3, אפליקציה: 1.5,
    עסק: 1.5, להקים: 2, לפתוח: 1.5, ליצור: 1.5, לכתוב: 1, ספר: 1, קורס: 1.5, סדנה: 1.5, מוצר: 0.5, תוכן: 1,
    חופשה: 1, וובינר: 1.5, שיתוף: 0.5, קמפיין: 1.5,
  },
  tasks: {
    // English
    call: 4, schedule: 4, send: 3, pay: 4, check: 2, arrange: 2.5, fix: 3, return: 3, renew: 3, submit: 3.5, remember: 3, reminder: 4, remind: 4, appointment: 4, meeting: 3, deadline: 4, forget: 3, pick: 2, collect: 2.5, clean: 2.5, bill: 2.5, insurance: 2.5, form: 2.5, email: 2, reply: 3, cancel: 3, register: 2.5, update: 2, bring: 2, sign: 2.5, doctor: 2.5, dentist: 3, garage: 2.5, urgent: 3, task: 4, tasks: 4, todo: 4, book: 1.5, tax: 2,
    לקבוע: 4, להתקשר: 4, לשלוח: 3, לשלם: 4, לבדוק: 2.5, לסדר: 2.5, לתקן: 3, להחזיר: 3, לחדש: 3, להגיש: 3.5,
    לזכור: 3, תזכורת: 4, תור: 3, פגישה: 3, דדליין: 4, לשכוח: 3, לאסוף: 3, לכבס: 3, לנקות: 3, להזמין: 1,
    חשבון: 2, רואה: 1, ביטוח: 2.5, ארנונה: 3, טופס: 2.5, מייל: 2, לענות: 3, לבטל: 3, לרשום: 2.5, לתאם: 3.5,
    לעדכן: 2.5, לקחת: 2, להביא: 2, לחתום: 3, להוציא: 1.5, רופא: 2.5, רופאה: 2.5, שיניים: 1.5, מוסך: 2.5,
    טסט: 2.5, לטפל: 3, דחוף: 3, משימה: 4, משימות: 4,
  },
  readlater: {
    // English
    article: 5, read: 4, reading: 4, watch: 3.5, video: 3, lecture: 3, talk: 2, newsletter: 3, episode: 2, interview: 2.5, post: 2, thread: 2, listen: 3, research: 2, study: 2, series: 2, movie: 2, interesting: 1.5, news: 2, later: 1.5,
    כתבה: 5, מאמר: 5, לקרוא: 4, לקריאה: 4, לצפות: 3.5, סרטון: 3, צפייה: 3, הרצאה: 3, ניוזלטר: 3, פרק: 1.5,
    תחקיר: 3, ראיון: 2.5, טור: 1.5, פוסט: 2, שרשור: 2, להאזין: 3, האזנה: 3, מחקר: 2, סדרה: 2, סרט: 2,
    מעניין: 1.5, חדשות: 2,
  },
  places: {
    // English
    restaurant: 5, restaurants: 5, cafe: 4, café: 4, coffee: 1.5, bistro: 4, bar: 2, hotel: 4, trip: 2.5, trail: 3, hike: 3, beach: 3, park: 3, museum: 4, visit: 3.5, place: 2, address: 2.5, street: 2, neighborhood: 2, gallery: 3, spring: 1, winery: 3, market: 2, pizzeria: 4, bakery: 2.5, sushi: 2, chef: 2, reservation: 3, table: 1.5,
    מסעדה: 5, מסעדות: 5, קפה: 1.5, ביסטרו: 4, בר: 2, מלון: 4, צימר: 4, טיול: 2.5, מסלול: 3, חוף: 3,
    פארק: 3, מוזיאון: 4, לבקר: 3.5, ביקור: 2.5, מקום: 2, כתובת: 2.5, רחוב: 2, שכונה: 2, גלריה: 3,
    תל: 1, אביב: 1.5, ירושלים: 2, חיפה: 2, אילת: 2, גליל: 2, גולן: 2, צפון: 1.5, נגב: 2, יפו: 2,
    איטליה: 2, רומא: 2.5, טוסקנה: 2.5, יוון: 2.5, פריז: 2.5, ברלין: 2.5, לונדון: 2.5, יורק: 1.5, אתונה: 2.5,
    שולחן: 1.5, מעיין: 3, נחל: 3, יקב: 3, שוק: 2, חומוס: 1, פיצרייה: 4, גלידה: 1.5, איטלקית: 2.5,
    אסייתית: 2, סושי: 2, בורגר: 2, שף: 2,
  },
};

/** Phrases checked on the normalized full text (strong, unambiguous signals). */
export const CATEGORY_PHRASES: Partial<Record<CategoryId, Record<string, number>>> = {
  shopping: { 'shopping list': 8, 'need to buy': 6, 'grocery list': 8, 'to buy': 3, 'running out of': 3, 'רשימת קניות': 8, 'צריך לקנות': 6, 'לקנות ב': 2, 'מה חסר': 3, 'לסופר': 3 },
  tasks: { "don't forget": 5, 'dont forget': 5, 'remind me': 6, 'need to': 2, 'have to': 2, 'book an appointment': 6, 'call the': 3, 'pay the': 3, 'לא לשכוח': 5, 'צריך ל': 2, 'עד יום': 2, 'לקבוע תור': 6, 'לשלם את': 3, 'להתקשר ל': 3 },
  ideas: { 'what if': 4, 'would be cool': 4, 'idea for': 4, 'we could': 2, 'מה אם': 4, 'יהיה מגניב': 4, 'כדאי לנסות': 2, 'רעיון ל': 4, 'אפשר לעשות': 2, 'לפתוח עסק': 4 },
  readlater: { 'read later': 6, 'worth reading': 5, 'worth watching': 5, 'to read': 4, 'to watch': 4, 'לקרוא אחר כך': 6, 'לקרוא בהמשך': 6, 'שווה קריאה': 5, 'שווה לקרוא': 5, 'שווה צפייה': 5 },
  places: { 'worth visiting': 6, 'coffee shop': 5, 'book a table': 4, 'place to': 2, 'שווה לבקר': 6, 'בית קפה': 5, 'תל אביב': 2, 'להזמין מקום': 4, 'מומלצת ב': 2, 'מומלץ ב': 2 },
  recipes: { 'אופן הכנה': 6, 'כוס קמח': 5, 'דקות בתנור': 5, 'מתכון ל': 5, 'recipe for': 5, 'minutes in the oven': 5, 'cup of': 3 },
};

export const TAG_KEYWORDS: Record<string, string[]> = {
  עבודה: ['עבודה', 'לקוח', 'לקוחות', 'מצגת', 'בוס', 'משרד', 'ישיבה', 'צוות', 'פרויקט', 'דוח', 'מנהל', 'פגישה'],
  עסק: ['עסק', 'עסקים', 'שיווק', 'מכירות', 'סטארטאפ', 'יזמות', 'חשבונית', 'רואה חשבון', 'הכנסות', 'מותג', 'מיזם', 'קורס'],
  בית: ['בית', 'דירה', 'תיקון', 'אינסטלטור', 'חשמלאי', 'ניקיון', 'כביסה', 'ארנונה', 'מקרר', 'מטבח', 'סלון', 'מרפסת', 'וועד'],
  משפחה: ['אמא', 'אבא', 'סבתא', 'סבא', 'ילדים', 'הילדים', 'משפחה', 'אחי', 'אחותי', 'אשתי', 'בעלי', 'הורים', 'גן', 'אסיפת'],
  טיול: ['טיול', 'חופשה', 'טיסה', 'מלון', 'צימר', 'איטליה', 'רומא', 'טוסקנה', 'יוון', 'פריז', 'מסלול', 'נחל', 'חול', 'אילת', 'גליל'],
  מתנה: ['מתנה', 'מתנות', 'יום הולדת', 'יומולדת', 'יום נישואין', 'הפתעה'],
  בריאות: ['רופא', 'רופאה', 'תור', 'ויטמין', 'תזונה', 'בריאות', 'ספורט', 'אימון', 'שיניים', 'טבעי', 'כושר', 'מרפאה'],
  ילדים: ['ילדים', 'הילדים', 'גן', 'בית ספר', 'חוג', 'צהרון', 'תינוק'],
};

export const TAG_KEYWORDS_EN: Record<string, string[]> = {
  work: ['work', 'client', 'clients', 'presentation', 'boss', 'office', 'meeting', 'team', 'project', 'report', 'manager'],
  business: ['business', 'marketing', 'sales', 'startup', 'invoice', 'accountant', 'revenue', 'brand', 'venture', 'course'],
  home: ['home', 'house', 'apartment', 'repair', 'plumber', 'electrician', 'cleaning', 'laundry', 'fridge', 'kitchen', 'living room', 'balcony'],
  family: ['mom', 'mum', 'dad', 'grandma', 'grandpa', 'kids', 'family', 'brother', 'sister', 'wife', 'husband', 'parents'],
  travel: ['trip', 'travel', 'vacation', 'holiday', 'flight', 'hotel', 'italy', 'rome', 'tuscany', 'greece', 'paris', 'trail', 'abroad'],
  gift: ['gift', 'gifts', 'present', 'birthday', 'anniversary', 'surprise'],
  health: ['doctor', 'appointment', 'vitamin', 'nutrition', 'health', 'sport', 'workout', 'dentist', 'natural', 'fitness', 'clinic', 'herbal'],
  kids: ['kids', 'children', 'kindergarten', 'school', 'class', 'baby', 'daycare'],
};

/** English starts that mean "this is a task". */
export const TASK_LEADS_EN = /^(need to|have to|must|don'?t forget|remember to|remind me|call|book|pay|send|fix|renew|schedule|return|pick up|email|reply|submit|cancel|buy a gift)\b/i;

/** Words that mean "this is a task" when they start the message (Hebrew infinitive). */
export const TASK_LEADS = /^(צריך\s+ל|חייב\s+ל|לא\s+לשכוח|תזכורת|ל(?!קנות)[א-ת]{2,}\s)/;
