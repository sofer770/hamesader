import { useState } from 'react';
import { Check } from 'lucide-react';
import type { CategoryId } from '../lib/types';
import { useStore } from '../state/store';
import { useNav } from '../state/nav';
import { CATEGORY_BY_ID } from '../lib/categories';
import { ItemCard, ItemList } from '../components/ItemCard';
import { CategoryPicker } from '../components/CategoryPicker';
import { EmptyState, Footer, ScreenHeader } from '../components/ui';
import { L } from '../lib/i18n';

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
    store.showToast({ text: L(`מצא את הבית שלו ב${c.name}`, `Moved to ${c.name}`), emoji: c.emoji });
  };

  return (
    <div>
      <ScreenHeader
        emoji="📥"
        title={L('תיבת קליטה', 'Inbox')}
        subtitle={inbox.length ? L('כל מה שנכנס לאחרונה, כבר ממוין. רק לאשר.', 'Everything that came in recently, already sorted. Just confirm.') : L('הכל מסודר', 'All sorted')}
        actions={
          inbox.length > 1 && (
            <button
              onClick={() => {
                inbox.forEach((i) => store.update(i.id, { reviewed: true }));
                store.showToast({ text: L('הכל אושר ומסודר', 'All confirmed and sorted'), emoji: '✨' });
              }}
              className="pressable h-10 rounded-full bg-brand px-4 text-sm font-semibold text-brand-ink"
            >
              {L('לאשר הכל', 'Confirm all')}
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
                  <span className={unsure ? 'font-semibold text-warn' : 'text-muted'}>{unsure ? L('🤔 לא בטוחים לגבי זה.', "🤔 We're not sure about this one.") : L(`${c.emoji} שמנו ב${c.name}.`, `${c.emoji} Filed in ${c.name}.`)}</span>
                  <button onClick={() => confirm(it.id)} className="pressable inline-flex h-8 items-center gap-1 rounded-full bg-done-soft px-3 font-semibold text-done">
                    <Check size={14} /> {unsure ? L(`להשאיר ב${c.name}`, `Keep in ${c.name}`) : L('נכון', 'Correct')}
                  </button>
                  <button onClick={() => setPickFor(it.id)} className="pressable h-8 rounded-full bg-sunken px-3 font-semibold text-ink">
                    {L('להעביר...', 'Move...')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          emoji="🏡"
          title={L('תיבת הקליטה ריקה', 'Your inbox is empty')}
          text={L('כל פריט כבר מצא את הבית שלו. מה שתשמרו מעכשיו יופיע כאן לרגע לפני שיתויק.', 'Every item has found its home. What you save from now on will show up here for a moment before it is filed.')}
          action={
            <button onClick={() => nav.openComposer()} className="pressable h-11 rounded-xl bg-brand px-5 font-semibold text-brand-ink">
              {L('הוספת משהו חדש', 'Add something new')}
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
      <ScreenHeader emoji="⭐" title={L('מועדפים', 'Favorites')} subtitle={L(`${favs.length} פריטים שחשוב לך למצוא מהר`, `${favs.length} ${favs.length === 1 ? 'item' : 'items'} you want to find fast`)} />
      {favs.length ? <ItemList items={favs} /> : <EmptyState emoji="⭐" title={L('עוד אין מועדפים', 'No favorites yet')} text={L('לחיצה על הכוכב בכל פריט תביא אותו לכאן.', 'Tap the star on any item to bring it here.')} />}
      <Footer />
    </div>
  );
}

export function TagScreen({ tag }: { tag: string }) {
  const { items } = useStore();
  const list = items.filter((i) => i.tags.includes(tag)).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return (
    <div>
      <ScreenHeader title={`#${tag}`} subtitle={L(`${list.length} פריטים עם התגית הזאת`, `${list.length} ${list.length === 1 ? 'item' : 'items'} with this tag`)} />
      {list.length ? <ItemList items={list} /> : <EmptyState emoji="🏷️" title={L('אין פריטים עם התגית הזאת', 'No items with this tag')} text={L('אפשר להוסיף תגית מתוך מסך של כל פריט.', 'You can add a tag from any item screen.')} />}
      <Footer />
    </div>
  );
}
