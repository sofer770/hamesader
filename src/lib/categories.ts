import type { CategoryId } from './types';

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
  { id: 'recipes', name: 'מתכונים', emoji: '🍳', blurb: 'מה מבשלים השבוע', tone: 'recipes' },
  { id: 'shopping', name: 'קניות', emoji: '🛒', blurb: 'רשימות ודברים לקנות', tone: 'shopping' },
  { id: 'ideas', name: 'רעיונות', emoji: '💡', blurb: 'מחשבות ששווה לשמור', tone: 'ideas' },
  { id: 'tasks', name: 'משימות', emoji: '✅', blurb: 'מה צריך לעשות', tone: 'tasks' },
  { id: 'readlater', name: 'לקריאה בהמשך', emoji: '🔗', blurb: 'כתבות, סרטונים וקישורים', tone: 'readlater' },
  { id: 'places', name: 'מקומות', emoji: '📍', blurb: 'מסעדות, טיולים וביקורים', tone: 'places' },
  { id: 'other', name: 'אחר', emoji: '📦', blurb: 'כל השאר', tone: 'other' },
];

export const CATEGORY_BY_ID: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryMeta>;

export const SUGGESTED_TAGS = ['עבודה', 'בית', 'משפחה', 'טיול', 'מתנה', 'עסק', 'בריאות', 'ילדים'];

/** Style helpers: soft background + readable ink per category */
export const toneBg = (id: CategoryId) => ({ backgroundColor: `rgb(var(--c-${CATEGORY_BY_ID[id].tone}-bg))` });
export const toneInk = (id: CategoryId) => ({ color: `rgb(var(--c-${CATEGORY_BY_ID[id].tone}-ink))` });
export const toneDot = (id: CategoryId) => ({ backgroundColor: `rgb(var(--c-${CATEGORY_BY_ID[id].tone}-ink))` });
