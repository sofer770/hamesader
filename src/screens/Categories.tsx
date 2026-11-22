import { useMemo, useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import type { CategoryId, Item } from '../lib/types';
import { useStore } from '../state/store';
import { useNav } from '../state/nav';
import { CATEGORIES, CATEGORY_BY_ID, toneBg, toneInk } from '../lib/categories';
import { addDays, daysBetween, fromISODate } from '../lib/dates';
import { classifier } from '../services/classifier';
import { ItemList, ItemCard } from '../components/ItemCard';
import { Checklist } from '../components/Checklist';
import { EmptyState, Footer, ScreenHeader, SectionTitle, Segmented, TagChip } from '../components/ui';

const byNewest = (a: Item, b: Item) => +new Date(b.createdAt) - +new Date(a.createdAt);

export function CategoriesScreen() {
  const { items, allTags } = useStore();
  const nav = useNav();
  return (
    <div>
      <ScreenHeader title="קטגוריות" subtitle={`${items.length} פריטים שמורים, כל אחד במקום שלו`} />
      <ul className="flex flex-col gap-2.5">
        {CATEGORIES.map((c) => {
          const list = items.filter((i) => i.category === c.id).sort(byNewest);
          return (
            <li key={c.id}>
              <button
                onClick={() => nav.go({ name: 'category', id: c.id })}
                className="pressable flex w-full items-center gap-4 rounded-3xl border border-line/70 bg-surface p-4 text-start shadow-soft hover:shadow-lift"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl" style={toneBg(c.id)} aria-hidden>
                  {c.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="font-display text-[17px] font-semibold">{c.name}</span>
                    <span className="tabular text-[14px] font-semibold" style={toneInk(c.id)}>
                      {list.length}
                    </span>
                  </span>
                  <span className="block truncate text-[14px] text-muted">{list.length ? list.slice(0, 2).map((i) => i.title).join(' · ') : c.blurb}</span>
                </span>
                <ChevronLeft size={20} className="shrink-0 text-faint" />
              </button>
            </li>
          );
        })}
      </ul>
      <SectionTitle>תגיות</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {allTags.map((t) => (
          <TagChip key={t} tag={`${t} · ${items.filter((i) => i.tags.includes(t)).length}`} onClick={() => nav.go({ name: 'tag', tag: t })} />
        ))}
      </div>
      <Footer />
    </div>
  );
}

export function CategoryScreen({ id }: { id: CategoryId }) {
  if (id === 'tasks') return <TasksScreen />;
  if (id === 'shopping') return <ShoppingScreen />;
  return <GenericCategory id={id} />;
}

function GenericCategory({ id }: { id: CategoryId }) {
  const { items } = useStore();
  const nav = useNav();
  const c = CATEGORY_BY_ID[id];
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<'new' | 'old' | 'fav'>('new');
  const all = items.filter((i) => i.category === id);
  const tags = [...new Set(all.flatMap((i) => i.tags))];
  let list = tag ? all.filter((i) => i.tags.includes(tag)) : all;
  list = [...list].sort(sort === 'old' ? (a, b) => -byNewest(a, b) : sort === 'fav' ? (a, b) => Number(b.favorite) - Number(a.favorite) || byNewest(a, b) : byNewest);
  const hint = id === 'ideas' ? 'idea' : id === 'readlater' ? 'link' : undefined;

  return (
    <div>
      <ScreenHeader
        emoji={c.emoji}
        title={c.name}
        subtitle={`${all.length} פריטים · ${c.blurb}`}
        actions={
          <button onClick={() => nav.openComposer(hint)} className="pressable grid h-10 w-10 place-items-center rounded-full" style={{ ...toneBg(id), ...toneInk(id) }} aria-label={`הוספה ל${c.name}`}>
            <Plus size={20} />
          </button>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="w-full max-w-sm">
          <Segmented
            size="sm"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'new', label: 'החדשים קודם' },
              { value: 'old', label: 'הישנים קודם' },
              { value: 'fav', label: 'מועדפים קודם' },
            ]}
          />
        </div>
      </div>
      {tags.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
          <TagChip tag="הכל" selected={!tag} onClick={() => setTag(null)} />
          {tags.map((t) => (
            <TagChip key={t} tag={t} selected={tag === t} onClick={() => setTag(tag === t ? null : t)} />
          ))}
        </div>
      )}
      {list.length ? (
        <ItemList items={list} showCategory={false} />
      ) : (
        <EmptyState
          emoji={c.emoji}
          title={`עוד אין כאן ${c.name}`}
          text="כל מה שתשמרו ושייך לכאן יגיע לבד."
          action={
            <button onClick={() => nav.openComposer(hint)} className="pressable h-11 rounded-xl bg-brand px-5 font-semibold text-brand-ink">
              הוספה ראשונה
            </button>
          }
        />
      )}
      <Footer />
    </div>
  );
}

type TaskFilter = 'today' | 'week' | 'later' | 'all' | 'done';

function TasksScreen() {
  const store = useStore();
  const nav = useNav();
  const [filter, setFilter] = useState<TaskFilter>('today');
  const [draft, setDraft] = useState('');
  const now = new Date();
  const tasks = store.items.filter((i) => i.category === 'tasks' && i.task);
  const open = tasks.filter((t) => !t.task!.done);
  const dueIn = (t: Item) => (t.task!.dueDate ? daysBetween(now, fromISODate(t.task!.dueDate)) : Infinity);
  const weekEnd = daysBetween(now, addDays(now, 6 - now.getDay()));

  const groups: Record<TaskFilter, Item[]> = useMemo(() => {
    const sortDue = (a: Item, b: Item) => dueIn(a) - dueIn(b) || prio(b) - prio(a);
    return {
      today: open.filter((t) => dueIn(t) <= 0).sort(sortDue),
      week: open.filter((t) => dueIn(t) > 0 && dueIn(t) <= Math.max(weekEnd, 1)).sort(sortDue),
      later: open.filter((t) => dueIn(t) > Math.max(weekEnd, 1)).sort(sortDue),
      all: [...open].sort(sortDue),
      done: tasks.filter((t) => t.task!.done).sort((a, b) => +new Date(b.task!.doneAt ?? 0) - +new Date(a.task!.doneAt ?? 0)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.items]);

  async function quickAdd() {
    const text = draft.trim();
    if (!text) return;
    const r = await classifier.classify({ text, hint: 'task' });
    const item = await store.addFromClassification(text, r, { category: 'tasks' });
    setDraft('');
    store.showToast({ text: r.dueDate ? 'המשימה נוספה עם תאריך יעד' : 'המשימה נוספה', emoji: '✅', action: { label: 'לפריט', run: () => nav.go({ name: 'item', id: item.id }) } });
  }

  const list = groups[filter];
  const empty: Record<TaskFilter, [string, string, string]> = {
    today: ['☀️', 'היום פנוי', 'אין משימות להיום. אפשר להתקדם עם משהו מהשבוע.'],
    week: ['🗓️', 'שבוע רגוע', 'אין משימות נוספות לשבוע הזה.'],
    later: ['🔭', 'אין משימות עתידיות', 'משימות עם תאריך רחוק יותר יופיעו כאן.'],
    all: ['🎉', 'אין משימות פתוחות', 'כל מה שהיה, בוצע. כל הכבוד!'],
    done: ['📋', 'עוד לא הושלמו משימות', 'משימות שתסמנו כבוצעו יחכו כאן.'],
  };

  return (
    <div>
      <ScreenHeader emoji="✅" title="משימות" subtitle={`${open.length} פתוחות · ${groups.done.length} הושלמו`} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          quickAdd();
        }}
        className="mb-4 flex items-center gap-2 rounded-2xl border border-line bg-surface p-1.5 ps-4 shadow-soft focus-within:border-brand/50"
      >
        <input
          id="quick-task"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder='משימה חדשה, למשל "להתקשר לאמא מחר ב-18:00"'
          className="h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-faint"
        />
        <button type="submit" disabled={!draft.trim()} className="pressable h-11 shrink-0 rounded-xl bg-brand px-4 font-semibold text-brand-ink disabled:opacity-40">
          הוספה
        </button>
      </form>
      <div className="mb-4">
        <Segmented
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'today', label: 'היום', count: groups.today.length },
            { value: 'week', label: 'השבוע', count: groups.week.length },
            { value: 'later', label: 'בהמשך', count: groups.later.length },
            { value: 'all', label: 'פתוחות', count: groups.all.length },
            { value: 'done', label: 'הושלמו', count: groups.done.length },
          ]}
        />
      </div>
      {list.length ? <ItemList items={list} showCategory={false} /> : <EmptyState emoji={empty[filter][0]} title={empty[filter][1]} text={empty[filter][2]} />}
      <Footer />
    </div>
  );
}
const prio = (t: Item) => ({ high: 3, medium: 2, low: 1 })[t.task?.priority ?? 'medium'];

function ShoppingScreen() {
  const store = useStore();
  const nav = useNav();
  const all = store.items.filter((i) => i.category === 'shopping').sort(byNewest);
  const lists = all.filter((i) => i.checklist);
  const singles = all.filter((i) => !i.checklist);

  async function newList() {
    const r = await classifier.classify({ text: 'רשימת קניות', hint: 'list' });
    const item = await store.addFromClassification('רשימת קניות חדשה', { ...r, title: 'רשימת קניות חדשה', listItems: [], isShoppingList: true }, { category: 'shopping' });
    store.update(item.id, { checklist: [] });
    nav.go({ name: 'item', id: item.id });
  }

  return (
    <div>
      <ScreenHeader
        emoji="🛒"
        title="קניות"
        subtitle={`${lists.length === 1 ? 'רשימה אחת' : `${lists.length} רשימות`} · ${singles.length === 1 ? 'דבר אחד לקנות' : `${singles.length} דברים לקנות`}`}
        actions={
          <button onClick={newList} className="pressable inline-flex h-10 items-center gap-1 rounded-full px-3.5 text-sm font-semibold" style={{ ...toneBg('shopping'), ...toneInk('shopping') }}>
            <Plus size={16} /> רשימה חדשה
          </button>
        }
      />
      {lists.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {lists.map((l) => (
            <section key={l.id} className="rounded-3xl border border-line/70 bg-surface p-4 shadow-soft">
              <button onClick={() => nav.go({ name: 'item', id: l.id })} className="mb-2 flex w-full items-center justify-between gap-2 text-start">
                <h2 className="font-display text-[17px] font-semibold">{l.title}</h2>
                <ChevronLeft size={18} className="text-faint" />
              </button>
              <Checklist item={l} compact />
            </section>
          ))}
        </div>
      )}
      <SectionTitle>דברים שרציתי לקנות</SectionTitle>
      {singles.length ? (
        <ul className="flex flex-col gap-2.5">
          {singles.map((i) => (
            <li key={i.id}>
              <ItemCard item={i} showCategory={false} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState emoji="🛍️" title="אין כאן כלום" text='כתבו "לקנות..." והמסדר יביא את זה לכאן.' />
      )}
      <Footer />
    </div>
  );
}
