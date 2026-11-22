import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Search as SearchIcon, Sparkles, X } from 'lucide-react';
import { useStore } from '../state/store';
import { useNav } from '../state/nav';
import { searchItems, EXAMPLE_QUERIES } from '../services/search';
import { CATEGORIES, CATEGORY_BY_ID, toneBg, toneInk } from '../lib/categories';
import { ItemList } from '../components/ItemCard';
import { EmptyState, Footer, SectionTitle, TagChip } from '../components/ui';

export function SearchScreen({ initial = '' }: { initial?: string }) {
  const { items, allTags, settings, updateSettings } = useStore();
  const nav = useNav();
  const [q, setQ] = useState(initial);
  const dq = useDeferredValue(q);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const { intent, hits } = useMemo(() => searchItems(items, dq, allTags), [items, dq, allTags]);
  const active = dq.trim().length > 0;

  // remember meaningful searches
  useEffect(() => {
    const query = dq.trim();
    if (query.length < 3 || !hits.length) return;
    const t = setTimeout(() => {
      const next = [query, ...settings.recentSearches.filter((s) => s !== query && !query.startsWith(s))].slice(0, 6);
      updateSettings({ recentSearches: next });
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq, hits.length]);

  const understood = active && (intent.category || intent.taskStatus || intent.favorites || intent.tag || intent.recentDays);

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 bg-bg/90 px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))] backdrop-blur-md lg:-mx-8 lg:px-8">
        <h1 className="mb-3 font-display text-[22px] font-semibold">חיפוש</h1>
        <div className="flex h-14 items-center gap-3 rounded-2xl border-2 border-brand/50 bg-surface px-4 shadow-soft focus-within:border-brand">
          <SearchIcon size={20} className="shrink-0 text-brand" />
          <input
            id="search-input"
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            enterKeyHint="search"
            type="search"
            placeholder="מה מחפשים? אפשר לשאול במילים שלך"
            className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
            aria-label="חיפוש"
          />
          {q && (
            <button onClick={() => (setQ(''), inputRef.current?.focus())} className="grid h-8 w-8 place-items-center rounded-full bg-sunken" aria-label="ניקוי החיפוש">
              <X size={16} />
            </button>
          )}
        </div>
        {understood && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted animate-fade-in">
            <Sparkles size={14} className="text-brand" />
            <span>הבנו שמחפשים:</span>
            {intent.category && (
              <span className="rounded-full px-2 py-0.5 font-semibold" style={{ ...toneBg(intent.category), ...toneInk(intent.category) }}>
                {CATEGORY_BY_ID[intent.category].emoji} {CATEGORY_BY_ID[intent.category].name}
              </span>
            )}
            {intent.taskStatus && (
              <span className="rounded-full bg-sunken px-2 py-0.5 font-semibold text-ink">{intent.taskStatus === 'open' ? 'שעוד לא בוצעו' : 'שכבר בוצעו'}</span>
            )}
            {intent.favorites && <span className="rounded-full bg-warn-soft px-2 py-0.5 font-semibold text-warn">⭐ מועדפים</span>}
            {intent.tag && <span className="rounded-full bg-sunken px-2 py-0.5 font-semibold text-ink">#{intent.tag}</span>}
            {intent.recentDays && <span className="rounded-full bg-sunken px-2 py-0.5 font-semibold text-ink">{intent.recentDays === 1 ? 'מהיום' : intent.recentDays === 7 ? 'מהשבוע האחרון' : 'מהחודש האחרון'}</span>}
            {intent.terms.length > 0 && <span className="font-semibold text-ink">"{intent.terms.join(' ')}"</span>}
          </div>
        )}
      </div>

      {active ? (
        <div className="mt-2">
          <p className="tabular mb-3 text-[14px] text-muted" aria-live="polite">
            {hits.length ? (hits.length === 1 ? 'נמצא פריט אחד' : `נמצאו ${hits.length} פריטים`) : ''}
          </p>
          {hits.length ? (
            <ItemList items={hits.map((h) => h.item)} terms={[...new Set(hits.flatMap((h) => h.terms))]} animate={false} />
          ) : (
            <EmptyState
              emoji="🔍"
              title="לא מצאנו את זה"
              text="נסו מילה אחרת, שם של אתר או קטגוריה. ואם זה עוד לא נשמר, אפשר לשמור עכשיו."
              action={
                <button onClick={() => nav.openComposer(undefined, q)} className="pressable h-11 rounded-xl bg-brand px-5 font-semibold text-brand-ink">
                  לשמור את "{q.length > 18 ? q.slice(0, 18) + '…' : q}"
                </button>
              }
            />
          )}
        </div>
      ) : (
        <div>
          {settings.recentSearches.length > 0 && (
            <>
              <SectionTitle action={<button onClick={() => updateSettings({ recentSearches: [] })} className="text-sm font-semibold text-muted hover:text-ink">ניקוי</button>}>
                חיפושים אחרונים
              </SectionTitle>
              <ul className="flex flex-col">
                {settings.recentSearches.map((s) => (
                  <li key={s}>
                    <button onClick={() => setQ(s)} className="flex h-11 w-full items-center gap-3 rounded-xl px-2 text-start hover:bg-sunken">
                      <Clock size={16} className="text-faint" />
                      <span className="truncate">{s}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <SectionTitle>אפשר לשאול כמו שמדברים</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((ex) => (
              <button key={ex} onClick={() => setQ(ex)} className="pressable rounded-2xl border border-line bg-surface px-3.5 py-2 text-[15px] shadow-soft hover:border-brand/40">
                {ex}
              </button>
            ))}
          </div>

          <SectionTitle>לפי קטגוריה</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => nav.go({ name: 'category', id: c.id })}
                className="pressable inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold"
                style={{ ...toneBg(c.id), ...toneInk(c.id) }}
              >
                <span aria-hidden>{c.emoji}</span>
                {c.name}
              </button>
            ))}
          </div>

          <SectionTitle>לפי תגית</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {allTags.map((t) => (
              <TagChip key={t} tag={t} onClick={() => nav.go({ name: 'tag', tag: t })} />
            ))}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
