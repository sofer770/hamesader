import { useEffect, type ReactNode } from 'react';
import { Home, LayoutGrid, Plus, Search, UserRound } from 'lucide-react';
import { useNav, type Tab } from '../state/nav';
import { useStore } from '../state/store';
import { Logo } from './ui';
import { Composer } from './Composer';

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'בית', icon: Home },
  { id: 'search', label: 'חיפוש', icon: Search },
  { id: 'categories', label: 'קטגוריות', icon: LayoutGrid },
  { id: 'profile', label: 'פרופיל', icon: UserRound },
];

function useReminders() {
  const { items, update, showToast } = useStore();
  const nav = useNav();
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const due = items.find((i) => i.task && !i.task.done && i.task.reminderAt && !i.task.reminderFired && new Date(i.task.reminderAt).getTime() <= now);
      if (!due) return;
      update(due.id, (i) => ({ task: i.task ? { ...i.task, reminderFired: true } : i.task }));
      showToast({ text: `תזכורת: ${due.title}`, emoji: '⏰', action: { label: 'פתח', run: () => nav.go({ name: 'item', id: due.id }) } });
      try {
        if ('Notification' in window && Notification.permission === 'granted') new Notification('המסדר', { body: due.title, icon: import.meta.env.BASE_URL + 'icons/icon-192.png' });
      } catch {
        /* notifications unavailable */
      }
    };
    check();
    const t = window.setInterval(check, 30_000);
    return () => window.clearInterval(t);
  }, [items, update, showToast, nav]);
}

/** Content shared from another app via the PWA share target (?title=&text=&url=) */
function useShareTarget() {
  const nav = useNav();
  useEffect(() => {
    try {
      const p = new URLSearchParams(location.search);
      const shared = [p.get('title'), p.get('text'), p.get('url')].filter(Boolean).join(' ').trim();
      if (shared) {
        nav.openComposer(undefined, shared);
        history.replaceState(null, '', location.pathname);
      }
    } catch {
      /* ignore */
    }
    // Android app: content shared from WhatsApp etc. arrives from MainActivity.java
    const onNative = () => {
      const w = window as unknown as { __hamesaderShare?: { id?: number; text?: string; image?: string }; __hamesaderLastShare?: number };
      const data = w.__hamesaderShare;
      if (!data || data.id === w.__hamesaderLastShare) return;
      w.__hamesaderLastShare = data.id;
      nav.openComposer(undefined, data.text ?? '', data.image ?? undefined);
    };
    onNative();
    window.addEventListener('hamesader-share', onNative);
    return () => window.removeEventListener('hamesader-share', onNative);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function ToastView() {
  const { toast, dismissToast } = useStore();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 lg:bottom-8">
      <div key={toast.id} role="status" className="pointer-events-auto flex max-w-md animate-pop-in items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-bg shadow-lift">
        {toast.emoji && <span className="text-lg" aria-hidden>{toast.emoji}</span>}
        <span className="text-[15px] font-semibold">{toast.text}</span>
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.run();
              dismissToast();
            }}
            className="ms-2 rounded-lg px-2 py-1 text-[14px] font-bold text-[rgb(var(--brand-soft))] underline-offset-4 hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const nav = useNav();
  const { items } = useStore();
  useReminders();
  useShareTarget();
  const inboxCount = items.filter((i) => !i.reviewed).length;

  return (
    <div className="flex h-full">
      {/* Desktop side rail (right side in RTL) */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-line bg-surface/60 px-4 py-6 lg:flex">
        <button onClick={() => nav.switchTab('home')} className="mb-8 flex items-center gap-3 px-2">
          <Logo size={44} />
          <div className="text-start">
            <div className="font-display text-xl font-bold leading-none">המסדר</div>
            <div className="mt-1 text-[13px] text-muted">כל מה ששמרת, במקום אחד</div>
          </div>
        </button>
        <button onClick={() => nav.openComposer()} className="pressable mb-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand font-display font-semibold text-brand-ink shadow-fab">
          <Plus size={20} strokeWidth={2.5} /> הוסף משהו חדש
        </button>
        <nav className="flex flex-col gap-1" aria-label="ניווט ראשי">
          {TABS.map((t) => {
            const active = nav.tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => nav.switchTab(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`pressable flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold ${active ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-sunken hover:text-ink'}`}
              >
                <t.icon size={20} strokeWidth={active ? 2.4 : 2} />
                {t.label}
              </button>
            );
          })}
          <button
            onClick={() => nav.go({ name: 'inbox' })}
            className="pressable flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-muted hover:bg-sunken hover:text-ink"
          >
            <span className="w-5 text-center" aria-hidden>📥</span>
            תיבת קליטה
            {inboxCount > 0 && <span className="tabular ms-auto rounded-full bg-brand px-2 text-[12px] text-brand-ink">{inboxCount}</span>}
          </button>
        </nav>
      </aside>

      <main id="main-scroll" className="relative min-w-0 flex-1 overflow-y-auto pb-[calc(88px+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="mx-auto w-full max-w-3xl pe-[max(16px,env(safe-area-inset-right))] ps-[max(16px,env(safe-area-inset-left))] lg:px-8">{children}</div>
      </main>

      {/* Mobile bottom navigation with the add button in the middle */}
      <nav
        aria-label="ניווט ראשי"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid h-[68px] max-w-lg grid-cols-5 items-center px-2">
          {TABS.slice(0, 2).map((t) => (
            <TabButton key={t.id} tab={t} />
          ))}
          <div className="flex justify-center">
            <button
              onClick={() => nav.openComposer()}
              aria-label="הוסף משהו חדש"
              className="pressable -mt-7 grid h-16 w-16 place-items-center rounded-[22px] bg-brand text-brand-ink shadow-fab ring-4 ring-bg"
            >
              <Plus size={30} strokeWidth={2.5} />
            </button>
          </div>
          {TABS.slice(2).map((t) => (
            <TabButton key={t.id} tab={t} />
          ))}
        </div>
      </nav>

      <Composer />
      <ToastView />
    </div>
  );
}

function TabButton({ tab }: { tab: (typeof TABS)[number] }) {
  const nav = useNav();
  const active = nav.tab === tab.id;
  return (
    <button
      onClick={() => nav.switchTab(tab.id)}
      aria-current={active ? 'page' : undefined}
      className={`pressable flex flex-col items-center gap-1 py-1 text-[12px] font-semibold ${active ? 'text-brand' : 'text-faint hover:text-muted'}`}
    >
      <tab.icon size={23} strokeWidth={active ? 2.4 : 2} />
      {tab.label}
    </button>
  );
}
