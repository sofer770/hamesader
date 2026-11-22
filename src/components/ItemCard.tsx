import { Bell, Check, Image as ImageIcon, Link2, Star } from 'lucide-react';
import type { Item } from '../lib/types';
import { CATEGORY_BY_ID, toneBg } from '../lib/categories';
import { formatDue, formatSaved, fromISODate, daysBetween } from '../lib/dates';
import { useStore } from '../state/store';
import { useNav } from '../state/nav';
import { Highlight } from './ui';
import { LinkCover } from './LinkCard';

export function dueTone(dueDate?: string, done?: boolean): string {
  if (!dueDate || done) return 'text-muted';
  const d = daysBetween(new Date(), fromISODate(dueDate));
  if (d < 0) return 'text-danger';
  if (d === 0) return 'text-warn';
  return 'text-muted';
}

export function TaskCheck({ item, size = 26 }: { item: Item; size?: number }) {
  const { toggleTask } = useStore();
  const done = item.task?.done;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleTask(item.id);
      }}
      aria-label={done ? 'סמן כלא בוצע' : 'סמן כבוצע'}
      aria-pressed={!!done}
      className={`pressable grid shrink-0 place-items-center rounded-full border-2 ${done ? 'border-done bg-done text-white' : 'border-faint/70 hover:border-done'}`}
      style={{ width: size, height: size }}
    >
      {done && <Check size={size * 0.6} strokeWidth={3} />}
    </button>
  );
}

const PRIORITY_DOT = { high: 'bg-danger', medium: 'bg-warn', low: 'bg-faint' } as const;

export function ItemCard({ item, terms = [], showCategory = true }: { item: Item; terms?: string[]; showCategory?: boolean }) {
  const { toggleFavorite } = useStore();
  const nav = useNav();
  const c = CATEGORY_BY_ID[item.category];
  const isTask = !!item.task;
  const done = item.task?.done;
  const checked = item.checklist?.filter((x) => x.checked).length ?? 0;
  const total = item.checklist?.length ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => nav.go({ name: 'item', id: item.id })}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), nav.go({ name: 'item', id: item.id }))}
      className="pressable group flex cursor-pointer items-start gap-3 rounded-3xl border border-line/70 bg-surface p-3.5 shadow-soft hover:border-line hover:shadow-lift"
    >
      {isTask ? (
        <div className="pt-0.5">
          <TaskCheck item={item} />
        </div>
      ) : item.image ? (
        <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover" />
      ) : item.link ? (
        <LinkCover cover={item.link.cover} className="h-12 w-12 shrink-0 rounded-2xl [&>span]:text-xl" />
      ) : (
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl" style={toneBg(item.category)} aria-hidden>
          {c.emoji}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className={`min-w-0 flex-1 text-[16px] font-semibold leading-snug ${done ? 'text-muted line-through decoration-faint' : ''}`}>
            <Highlight text={item.title} terms={terms} />
          </h3>
          {!item.reviewed && <span className="mt-0.5 shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">חדש</span>}
        </div>

        {terms.length > 0 && item.rawText !== item.title && (
          <p className="mt-0.5 line-clamp-1 text-[14px] text-muted">
            <Highlight text={item.rawText.replace(/https?:\/\/\S+/g, '').trim() || item.summary || ''} terms={terms} />
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted">
          {showCategory && (
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>{c.emoji}</span>
              {c.name}
            </span>
          )}
          {item.task?.dueDate && (
            <span className={`inline-flex items-center gap-1 font-semibold ${dueTone(item.task.dueDate, done)}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[item.task.priority]}`} />
              {formatDue(item.task.dueDate)}
              {item.task.dueTime && <span className="tabular">{item.task.dueTime}</span>}
            </span>
          )}
          {item.task?.reminderAt && !done && <Bell size={13} className="text-brand" aria-label="יש תזכורת" />}
          {total > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="relative h-1.5 w-12 overflow-hidden rounded-full bg-sunken">
                <span className="absolute inset-y-0 right-0 rounded-full bg-done" style={{ width: `${(checked / total) * 100}%` }} />
              </span>
              <span className="tabular">
                {checked}/{total}
              </span>
            </span>
          )}
          {item.link && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <Link2 size={13} />
              <span className="truncate">{item.link.siteName}</span>
            </span>
          )}
          {item.image && <ImageIcon size={13} aria-label="תמונה" />}
          {!isTask && <span>{formatSaved(item.createdAt)}</span>}
          {item.tags.slice(0, 2).map((t) => (
            <span key={t} className="text-faint">
              #<Highlight text={t} terms={terms} />
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(item.id);
        }}
        aria-label={item.favorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        aria-pressed={item.favorite}
        className={`pressable -m-1 grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-sunken ${item.favorite ? 'text-warn' : 'text-faint/70 opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}`}
      >
        <Star size={18} fill={item.favorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

export function ItemList({ items, terms, showCategory, animate = true }: { items: Item[]; terms?: string[]; showCategory?: boolean; animate?: boolean }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it, i) => (
        <li key={it.id} className={animate ? 'animate-pop-in' : ''} style={animate ? { animationDelay: `${Math.min(i, 8) * 25}ms` } : undefined}>
          <ItemCard item={it} terms={terms} showCategory={showCategory} />
        </li>
      ))}
    </ul>
  );
}
