import type { CategoryId } from './types';
import { isEn, L } from './i18n';

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  emoji: string;
  /** Short line under the category name */
  blurb: string;
  /** CSS variable prefix for the soft category palette */
  tone: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'recipes', name: L('מתכונים', 'Recipes'), emoji: '🍳', blurb: L('מה מבשלים השבוע', "What's cooking this week"), tone: 'recipes' },
  { id: 'shopping', name: L('קניות', 'Shopping'), emoji: '🛒', blurb: L('רשימות ודברים לקנות', 'Lists and things to buy'), tone: 'shopping' },
  { id: 'ideas', name: L('רעיונות', 'Ideas'), emoji: '💡', blurb: L('מחשבות ששווה לשמור', 'Thoughts worth keeping'), tone: 'ideas' },
  { id: 'tasks', name: L('משימות', 'Tasks'), emoji: '✅', blurb: L('מה צריך לעשות', 'What needs doing'), tone: 'tasks' },
  { id: 'readlater', name: L('לקריאה בהמשך', 'Read later'), emoji: '🔗', blurb: L('כתבות, סרטונים וקישורים', 'Articles, videos and links'), tone: 'readlater' },
  { id: 'places', name: L('מקומות', 'Places'), emoji: '📍', blurb: L('מסעדות, טיולים וביקורים', 'Restaurants, trips and visits'), tone: 'places' },
  { id: 'other', name: L('אחר', 'Other'), emoji: '📦', blurb: L('כל השאר', 'Everything else'), tone: 'other' },
];

export const CATEGORY_BY_ID: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryMeta>;

export const SUGGESTED_TAGS = isEn
  ? ['work', 'home', 'family', 'travel', 'gift', 'business', 'health', 'kids']
  : ['עבודה', 'בית', 'משפחה', 'טיול', 'מתנה', 'עסק', 'בריאות', 'ילדים'];

/** Style helpers: soft background + readable ink per category */
export const toneBg = (id: CategoryId) => ({ backgroundColor: `rgb(var(--c-${CATEGORY_BY_ID[id].tone}-bg))` });
export const toneInk = (id: CategoryId) => ({ color: `rgb(var(--c-${CATEGORY_BY_ID[id].tone}-ink))` });
export const toneDot = (id: CategoryId) => ({ backgroundColor: `rgb(var(--c-${CATEGORY_BY_ID[id].tone}-ink))` });
