import { useState } from 'react';
import { Check } from 'lucide-react';
import type { CategoryId } from '../lib/types';
import { useStore } from '../state/store';
import { useNav } from '../state/nav';
import { CATEGORY_BY_ID } from '../lib/categories';
import { ItemCard, ItemList } from '../components/ItemCard';
import { CategoryPicker } from '../components/CategoryPicker';
import { EmptyState, Footer, ScreenHeader } from '../components/ui';

export function InboxScreen() {
  const store = useStore();
  const nav = useNav();
  const [pickFor, setPickFor] = useState<string | null>(null);
  const inbox = store.items.filter((i) => !i.reviewed).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const pickItem = store.items.find((i) => i.id === pickFor);

  const confirm = (id: string, cat?: CategoryId) => {
    store.update(id, (i) => ({ reviewed: true, ...(cat ? { category: cat, confidence: 1, ...(cat === 'tasks' && !i.task ? { task: { done: false, priority: 'medium' as const } } : {}) } : {}) }));
    const c = CATEGORY_BY_ID[cat ?? store.items.find((i) => i.id === id)!.category];
    nav.markFiled(c.id);
    store.showToast({ text: `מצא את הבית שלו ב${c.name}`, emoji: c.emoji });
  };

  return (
    <div>
      <ScreenHeader
        emoji="📥"
        title="תיבת קליטה"
        subtitle={inbox.length ? 'כל מה שנכנס לאחרונה, כבר ממוין. רק לאשר.' : 'הכל מסודר'}
        actions={
          inbox.length > 1 && (
            <button
              onClick={() => {
                inbox.forEach((i) => store.update(i.id, { reviewed: true }));
                store.showToast({ text: 'הכל אושר ומסודר', emoji: '✨' });
              }}
              className="pressable h-10 rounded-full bg-brand px-4 text-sm font-semibold text-brand-ink"
            >
              לאשר הכל
            </button>
          )
        }
      />
      {inbox.length ? (
        <ul className="flex flex-col gap-4">
          {inbox.map((it) => {
            const c = CATEGORY_BY_ID[it.category];
            const unsure = it.confidence < 0.6;
            return (
              <li key={it.id} className="animate-pop-in">
                <ItemCard item={it} />
                <div className="mt-2 flex flex-wrap items-center gap-2 px-1 text-[14px]">
                  <span className={unsure ? 'font-semibold text-warn' : 'text-muted'}>{unsure ? '🤔 לא בטוחים לגבי זה.' : `${c.emoji} שמנו ב${c.name}.`}</span>
                  <button onClick={() => confirm(it.id)} className="pressable inline-flex h-8 items-center gap-1 rounded-full bg-done-soft px-3 font-semibold text-done">
                    <Check size={14} /> {unsure ? `להשאיר ב${c.name}` : 'נכון'}
                  </button>
                  <button onClick={() => setPickFor(it.id)} className="pressable h-8 rounded-full bg-sunken px-3 font-semibold text-ink">
                    להעביר...
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          emoji="🏡"
          title="תיבת הקליטה ריקה"
          text="כל פריט כבר מצא את הבית שלו. מה שתשמרו מעכשיו יופיע כאן לרגע לפני שיתויק."
          action={
            <button onClick={() => nav.openComposer()} className="pressable h-11 rounded-xl bg-brand px-5 font-semibold text-brand-ink">
              הוספת משהו חדש
            </button>
          }
        />
      )}
      {pickItem && (
        <CategoryPicker
          open
          current={pickItem.category}
          onPick={(cat) => {
            confirm(pickItem.id, cat);
            setPickFor(null);
          }}
          onClose={() => setPickFor(null)}
        />
      )}
      <Footer />
    </div>
  );
}

export function FavoritesScreen() {
  const { items } = useStore();
  const favs = items.filter((i) => i.favorite).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return (
    <div>
      <ScreenHeader emoji="⭐" title="מועדפים" subtitle={`${favs.length} פריטים שחשוב לך למצוא מהר`} />
      {favs.length ? <ItemList items={favs} /> : <EmptyState emoji="⭐" title="עוד אין מועדפים" text="לחיצה על הכוכב בכל פריט תביא אותו לכאן." />}
      <Footer />
    </div>
  );
}

export function TagScreen({ tag }: { tag: string }) {
  const { items } = useStore();
  const list = items.filter((i) => i.tags.includes(tag)).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return (
    <div>
      <ScreenHeader title={`#${tag}`} subtitle={`${list.length} פריטים עם התגית הזאת`} />
      {list.length ? <ItemList items={list} /> : <EmptyState emoji="🏷️" title="אין פריטים עם התגית הזאת" text="אפשר להוסיף תגית מתוך מסך של כל פריט." />}
      <Footer />
    </div>
  );
}
