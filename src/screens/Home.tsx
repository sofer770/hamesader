import { formatReminder, isReminderPending } from '../lib/reminders';
import { useMemo, useState } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { useStore } from '../state/store';
import { gregorianToday, hebrewToday } from '../lib/hebrewDate';
import { useNav } from '../state/nav';
import { CATEGORIES, toneBg, toneInk } from '../lib/categories';
import { daysBetween, fromISODate } from '../lib/dates';
import { ItemList } from '../components/ItemCard';
import { InstallButton, InstallCard } from '../components/InstallCard';
import { EmptyState, Footer, LinkButton, Logo, SectionTitle, Segmented } from '../components/ui';
import type { ContentType } from '../lib/types';
import { isEn, L, setLang } from '../lib/i18n';

function greeting(h: number) {
  if (h >= 5 && h < 12) return L('בוקר טוב', 'Good morning');
  if (h >= 12 && h < 17) return L('צהריים טובים', 'Good afternoon');
  if (h >= 17 && h < 22) return L('ערב טוב', 'Good evening');
  return L('לילה טוב', 'Good night');
}

const QUICK: { hint: ContentType; label: string; emoji: string }[] = [
  { hint: 'link', label: L('קישור', 'Link'), emoji: '🔗' },
  { hint: 'task', label: L('משימה', 'Task'), emoji: '✅' },
  { hint: 'idea', label: L('רעיון', 'Idea'), emoji: '💡' },
  { hint: 'list', label: L('רשימה', 'List'), emoji: '🛒' },
  { hint: 'image', label: L('תמונה', 'Image'), emoji: '🖼️' },
];

export function HomeScreen() {
  const { items, settings } = useStore();
  const nav = useNav();
  const [recentMode, setRecentMode] = useState<'recent' | 'favorites'>('recent');
  const now = new Date();

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of items) m[it.category] = (m[it.category] ?? 0) + 1;
    return m;
  }, [items]);

  const pending = useMemo(
    () =>
      items
        .filter((i) => i.task && !i.task.done && i.task.dueDate && daysBetween(now, fromISODate(i.task.dueDate)) <= 1)
        .sort((a, b) => (a.task!.dueDate! < b.task!.dueDate! ? -1 : 1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  );
  const openTasks = items.filter((i) => i.task && !i.task.done).length;
  const todayCount = pending.filter((i) => daysBetween(now, fromISODate(i.task!.dueDate!)) <= 0).length;
  const inbox = items.filter((i) => !i.reviewed);
  const reminders = items.filter(isReminderPending).sort((a, b) => +new Date(a.reminderAt!) - +new Date(b.reminderAt!));
  const favorites = items.filter((i) => i.favorite);
  const recent = [...(recentMode === 'recent' ? items : favorites)].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6);

  return (
    <div className="pt-[max(16px,env(safe-area-inset-top))]">
      {/* Greeting */}
      <div className="flex items-center gap-3 pt-2">
        <Logo size={44} className="shadow-soft lg:hidden" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[24px] font-semibold leading-tight">
            {greeting(now.getHours())}{settings.name ? `, ${settings.name}` : ''} 👋
          </h1>
          <p className="tabular mt-0.5 flex flex-wrap gap-x-2 text-[14px]">
            <span className="whitespace-nowrap font-semibold text-brand">{gregorianToday(now)}</span>
            {hebrewToday(now) && <span className="whitespace-nowrap text-muted">{hebrewToday(now)}</span>}
          </p>
          <p className="text-[15px] text-muted">
            {todayCount > 0
              ? todayCount === 1
                ? L('משימה אחת מחכה להיום', '1 task waiting for today')
                : L(`${todayCount} משימות מחכות להיום`, `${todayCount} tasks waiting for today`)
              : items.length
                ? L('הכל מסודר. מה שומרים היום?', 'All sorted. What are we saving today?')
                : L('בואו נתחיל לסדר', "Let's get organized")}
          </p>
          <InstallButton />
        </div>
        <button
          onClick={() => setLang(isEn ? 'he' : 'en')}
          aria-label={isEn ? 'Switch to Hebrew' : 'Switch to English'}
          title={isEn ? 'עברית' : 'English'}
          className="pressable grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft font-display text-[16px] font-bold text-brand"
        >
          {isEn ? 'עב' : 'En'}
        </button>
      </div>

      {/* Search */}
      <button
        onClick={() => nav.switchTab('search')}
        className="pressable mt-5 flex h-14 w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 text-start text-[16px] text-faint shadow-soft hover:border-brand/40"
      >
        <Search size={20} className="text-muted" />
        <span className="truncate">{L('חפשו כל דבר... "המתכון לעוגת שוקולד"', 'Search anything... "the chocolate cake recipe"')}</span>
      </button>

      <div className="mt-3">
        <InstallCard dismissible />
      </div>

      {/* Quick add */}
      <div className="mt-3 rounded-3xl bg-hero p-4 text-hero-ink shadow-fab">
        <button onClick={() => nav.openComposer()} className="pressable flex w-full items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 text-start hover:bg-white/20">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/90 text-xl font-bold text-[rgb(58_47_134)]">+</span>
          <span>
            <span className="block font-display text-[17px] font-semibold">{L('הוסף משהו חדש', 'Add something new')}</span>
            <span className="block text-[14px] opacity-80">{L('שלחו לכאן כמו להודעות לעצמי. אנחנו נסדר.', "Send it here like a message to yourself. We'll sort it.")}</span>
          </span>
        </button>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {QUICK.map((q) => (
            <button
              key={q.hint}
              onClick={() => nav.openComposer(q.hint)}
              className="pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/12 px-3.5 text-sm font-semibold ring-1 ring-white/25 hover:bg-white/20"
            >
              <span aria-hidden>{q.emoji}</span>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inbox */}
      {inbox.length > 0 && (
        <button
          onClick={() => nav.go({ name: 'inbox' })}
          className="pressable mt-4 flex w-full items-center gap-3 rounded-2xl border border-brand/20 bg-brand-soft p-3.5 text-start"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-xl" aria-hidden>
            📥
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">
              {inbox.length === 1 ? L('פריט חדש בתיבת הקליטה', '1 new item in your inbox') : L(`${inbox.length} פריטים חדשים בתיבת הקליטה`, `${inbox.length} new items in your inbox`)}
            </span>
            <span className="block text-[14px] text-muted">{L('כבר מיינו אותם בשבילך. רק לאשר במבט.', 'Already sorted for you. Just confirm at a glance.')}</span>
          </span>
          <ChevronLeft size={20} className="text-brand" />
        </button>
      )}

      {/* Upcoming reminders */}
      {reminders.length > 0 && (
        <div className="mt-4 rounded-2xl border border-line/70 bg-surface p-3.5 shadow-soft">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <span aria-hidden>⏰</span> {L('תזכורות קרובות', 'Upcoming reminders')}
          </div>
          <ul className="flex flex-col">
            {reminders.slice(0, 3).map((r) => (
              <li key={r.id}>
                <button onClick={() => nav.go({ name: 'item', id: r.id })} className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-start hover:bg-sunken">
                  <span className="tabular shrink-0 rounded-lg bg-brand-soft px-2 py-1 text-[13px] font-semibold text-brand">{formatReminder(r.reminderAt!)}</span>
                  <span className="min-w-0 flex-1 truncate text-[15px]">{r.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Categories */}
      <SectionTitle action={<LinkButton onClick={() => nav.switchTab('categories')}>{L('הכל', 'All')}</LinkButton>}>{L('הקטגוריות שלך', 'Your categories')}</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => nav.go({ name: 'category', id: c.id })}
            className={`pressable flex flex-col items-start gap-3 rounded-3xl p-4 text-start ${nav.justFiled === c.id ? 'animate-home-found ring-2 ring-current' : ''}`}
            style={{ ...toneBg(c.id), ...(nav.justFiled === c.id ? toneInk(c.id) : {}) }}
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-surface/70 text-xl" aria-hidden>
              {c.emoji}
            </span>
            <span className="w-full">
              <span className="block font-semibold text-ink">{c.name}</span>
              <span className="tabular block text-[13px] font-semibold" style={toneInk(c.id)}>
                {counts[c.id] ? (counts[c.id] === 1 ? L('פריט אחד', '1 item') : L(`${counts[c.id]} פריטים`, `${counts[c.id]} items`)) : L('ריק בינתיים', 'Empty for now')}
              </span>
            </span>
          </button>
        ))}
        <button onClick={() => nav.go({ name: 'favorites' })} className="pressable flex flex-col items-start gap-3 rounded-3xl border border-line bg-surface p-4 text-start">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-warn-soft text-xl" aria-hidden>
            ⭐
          </span>
          <span>
            <span className="block font-semibold">{L('מועדפים', 'Favorites')}</span>
            <span className="tabular block text-[13px] font-semibold text-warn">{favorites.length === 1 ? L('פריט אחד', '1 item') : L(`${favorites.length} פריטים`, `${favorites.length} items`)}</span>
          </span>
        </button>
      </div>

      {/* Pending tasks */}
      <SectionTitle action={<LinkButton onClick={() => nav.go({ name: 'category', id: 'tasks' })}>{L(`כל המשימות (${openTasks})`, `All tasks (${openTasks})`)}</LinkButton>}>{L('מחכה לטיפול', 'Needs attention')}</SectionTitle>
      {pending.length ? (
        <ItemList items={pending.slice(0, 4)} showCategory={false} />
      ) : (
        <EmptyState emoji="🌿" title={L('אין משימות דחופות', 'No urgent tasks')} text={L('אין כרגע משימות להיום או למחר. אפשר לנשום.', 'Nothing due today or tomorrow. Time to breathe.')} />
      )}

      {/* Recent / favorites */}
      <SectionTitle>{L('נשמר לאחרונה', 'Recently saved')}</SectionTitle>
      <div className="mb-3 max-w-xs">
        <Segmented
          size="sm"
          value={recentMode}
          onChange={setRecentMode}
          options={[
            { value: 'recent', label: L('אחרונים', 'Recent') },
            { value: 'favorites', label: L('⭐ מועדפים', '⭐ Favorites'), count: favorites.length },
          ]}
        />
      </div>
      {recent.length ? (
        <ItemList items={recent} />
      ) : (
        <EmptyState
          emoji={recentMode === 'favorites' ? '⭐' : '📭'}
          title={recentMode === 'favorites' ? L('עוד אין מועדפים', 'No favorites yet') : L('עוד לא שמרת כלום', "You haven't saved anything yet")}
          text={recentMode === 'favorites' ? L('לחיצה על הכוכב בכל פריט תשמור אותו כאן.', 'Tap the star on any item to keep it here.') : L('לחצו על הפלוס ושלחו את הדבר הראשון.', 'Tap the plus and send the first thing.')}
        />
      )}
      <Footer />
    </div>
  );
}
