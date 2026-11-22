import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { CategoryId, ChecklistEntry, ClassificationResult, Item } from '../lib/types';
import { localRepository, settingsStore, uid, type Settings } from '../services/storage';
import { buildDemoItems } from '../data/demo';
import { localLinkPreview } from '../services/linkPreview';
import { SUGGESTED_TAGS } from '../lib/categories';

type Action =
  | { type: 'set'; items: Item[] }
  | { type: 'add'; item: Item }
  | { type: 'update'; id: string; patch: Partial<Item> | ((it: Item) => Partial<Item>) }
  | { type: 'remove'; id: string }
  | { type: 'restore'; item: Item; index: number };

function reducer(state: Item[], a: Action): Item[] {
  switch (a.type) {
    case 'set':
      return a.items;
    case 'add':
      return [a.item, ...state];
    case 'update':
      return state.map((it) =>
        it.id === a.id ? { ...it, ...(typeof a.patch === 'function' ? a.patch(it) : a.patch), updatedAt: new Date().toISOString() } : it,
      );
    case 'remove':
      return state.filter((it) => it.id !== a.id);
    case 'restore': {
      const next = [...state];
      next.splice(Math.min(a.index, next.length), 0, a.item);
      return next;
    }
  }
}

export interface Toast {
  id: string;
  text: string;
  emoji?: string;
  action?: { label: string; run: () => void };
}

interface Store {
  items: Item[];
  settings: Settings;
  allTags: string[];
  toast: Toast | null;
  showToast(t: Omit<Toast, 'id'>): void;
  dismissToast(): void;
  updateSettings(patch: Partial<Settings>): void;
  addFromClassification(raw: string, r: ClassificationResult, extra?: { image?: string; category?: CategoryId; tags?: string[] }): Promise<Item>;
  update(id: string, patch: Partial<Item> | ((it: Item) => Partial<Item>)): void;
  remove(id: string): void;
  toggleFavorite(id: string): void;
  toggleTask(id: string): void;
  toggleCheck(id: string, entryId: string): void;
  resetDemo(): void;
  clearAll(): void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => settingsStore.load());
  const [items, dispatch] = useReducer(reducer, undefined, () => {
    const saved = localRepository.load();
    if (saved && settingsStore.load().seeded)
      return saved.map((i) =>
        i.task?.reminderAt && !i.reminderAt
          ? { ...i, reminderAt: i.task.reminderAt, reminderFired: i.task.reminderFired, task: { ...i.task, reminderAt: undefined, reminderFired: undefined } }
          : i,
      );
    return buildDemoItems();
  });
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number>();

  useEffect(() => {
    localRepository.save(items);
    if (!settings.seeded) updateSettings({ seeded: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => settingsStore.save(settings), [settings]);

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    window.clearTimeout(toastTimer.current);
    setToast({ ...t, id: uid() });
    toastTimer.current = window.setTimeout(() => setToast(null), t.action ? 5000 : 2600);
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of [...SUGGESTED_TAGS, ...settings.customTags]) counts.set(t, 0);
    for (const it of items) for (const t of it.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [items, settings.customTags]);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const store: Store = {
    items,
    settings,
    allTags,
    toast,
    showToast,
    dismissToast,
    updateSettings,
    async addFromClassification(raw, r, extra) {
      const now = new Date().toISOString();
      const category = extra?.category ?? r.category;
      const isTask = category === 'tasks';
      const listItems = category === 'shopping' ? r.listItems : [];
      const link = r.url ? await localLinkPreview.preview(r.url) : undefined;
      const item: Item = {
        id: uid(),
        createdAt: now,
        updatedAt: now,
        rawText: raw,
        title: r.title,
        summary: r.summary,
        category,
        contentType: extra?.image ? 'image' : r.contentType,
        url: r.url,
        link,
        tags: extra?.tags ?? r.tags,
        notes: '',
        favorite: false,
        reviewed: !!extra?.category || r.confidence >= 0.75,
        confidence: extra?.category ? 1 : r.confidence,
        task: isTask ? { done: false, dueDate: r.dueDate, dueTime: r.dueTime, priority: 'medium' } : undefined,
        checklist: listItems.length >= 2 ? listItems.map((text): ChecklistEntry => ({ id: uid(), text, checked: false })) : undefined,
        image: extra?.image,
      };
      // "תזכיר לי מחר ב-9..." -> set the reminder automatically
      if (/תזכ(י|ו)ר|להזכיר/.test(raw) && r.dueDate) {
        const at = new Date(`${r.dueDate}T${r.dueTime ?? '09:00'}`);
        if (at.getTime() > Date.now()) {
          item.reminderAt = at.toISOString();
          item.reminderFired = false;
        }
      }
      dispatch({ type: 'add', item });
      return item;
    },
    update: (id, patch) => dispatch({ type: 'update', id, patch }),
    remove(id) {
      const index = itemsRef.current.findIndex((i) => i.id === id);
      const item = itemsRef.current[index];
      if (!item) return;
      dispatch({ type: 'remove', id });
      showToast({ text: 'הפריט נמחק', emoji: '🗑️', action: { label: 'ביטול', run: () => dispatch({ type: 'restore', item, index }) } });
    },
    toggleFavorite(id) {
      const it = itemsRef.current.find((i) => i.id === id);
      dispatch({ type: 'update', id, patch: (i) => ({ favorite: !i.favorite }) });
      if (it) showToast({ text: it.favorite ? 'הוסר מהמועדפים' : 'נוסף למועדפים', emoji: it.favorite ? '🤍' : '⭐' });
    },
    toggleTask(id) {
      dispatch({
        type: 'update',
        id,
        patch: (i) => ({ task: i.task ? { ...i.task, done: !i.task.done, doneAt: !i.task.done ? new Date().toISOString() : undefined } : i.task }),
      });
    },
    toggleCheck(id, entryId) {
      dispatch({
        type: 'update',
        id,
        patch: (i) => ({ checklist: i.checklist?.map((c) => (c.id === entryId ? { ...c, checked: !c.checked } : c)) }),
      });
    },
    resetDemo() {
      dispatch({ type: 'set', items: buildDemoItems() });
      showToast({ text: 'נתוני הדוגמה נטענו מחדש', emoji: '✨' });
    },
    clearAll() {
      dispatch({ type: 'set', items: [] });
      showToast({ text: 'כל הפריטים נמחקו. אפשר להתחיל מחדש', emoji: '🧹' });
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
}
