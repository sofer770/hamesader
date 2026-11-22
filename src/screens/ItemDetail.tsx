import { useEffect, useState, type ReactNode } from 'react';
import { Bell, CalendarDays, Check, Copy, ExternalLink, Flag, ListChecks, MessageCircle, Pencil, Share2, Star, Trash2 } from 'lucide-react';
import type { CategoryId, Item, Priority } from '../lib/types';
import { useStore } from '../state/store';
import { useNav } from '../state/nav';
import { CATEGORY_BY_ID } from '../lib/categories';
import { formatDue, formatFullDate, toISODate } from '../lib/dates';
import { formatReminder } from '../lib/reminders';
import { ReminderSheet } from '../components/ReminderSheet';
import { parseListItems } from '../services/classifier/ruleBased';
import { uid } from '../services/storage';
import { LinkCard } from '../components/LinkCard';
import { Checklist } from '../components/Checklist';
import { TagEditor } from '../components/TagEditor';
import { CategoryPicker } from '../components/CategoryPicker';
import { CategoryBadge, EmptyState, Footer, IconButton, ScreenHeader, Segmented } from '../components/ui';
import { TaskCheck } from '../components/ItemCard';

function Block({ title, icon, children, action }: { title: string; icon?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line/70 bg-surface p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[14px] font-bold text-muted">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ItemDetailScreen({ id }: { id: string }) {
  const store = useStore();
  const nav = useNav();
  const item = store.items.find((i) => i.id === id);
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [title, setTitle] = useState(item?.title ?? '');
  const [raw, setRaw] = useState(item?.rawText ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [reminderOpen, setReminderOpen] = useState(false);

  useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setRaw(item.rawText);
    setNotes(item.notes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item) {
    return (
      <div>
        <ScreenHeader title="הפריט לא נמצא" />
        <EmptyState emoji="🫥" title="הפריט הזה כבר לא כאן" text="אולי הוא נמחק. אפשר לחזור ולחפש משהו אחר." />
        <Footer />
      </div>
    );
  }

  const c = CATEGORY_BY_ID[item.category];
  const up = (patch: Partial<Item> | ((i: Item) => Partial<Item>)) => store.update(item.id, patch);

  function moveTo(cat: CategoryId) {
    setPicker(false);
    up((i) => {
      const patch: Partial<Item> = { category: cat, reviewed: true, confidence: 1 };
      if (cat === 'tasks' && !i.task) patch.task = { done: false, priority: 'medium' };
      if (cat === 'shopping' && !i.checklist) {
        const list = parseListItems(i.rawText);
        if (list.length >= 2) patch.checklist = list.map((text) => ({ id: uid(), text, checked: false }));
      }
      return patch;
    });
    nav.markFiled(cat);
    store.showToast({ text: `הועבר ל${CATEGORY_BY_ID[cat].name}`, emoji: CATEGORY_BY_ID[cat].emoji });
  }

  const shareText = [item.title, item.url, item.notes].filter(Boolean).join('\n');

  async function share() {
    try {
      if ((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()) {
        const { Share } = await import('@capacitor/share');
        await Share.share({ title: item!.title, text: shareText, dialogTitle: 'שיתוף' });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: item!.title, text: shareText, url: item!.url });
        return;
      }
      throw new Error('no share');
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(shareText);
        store.showToast({ text: 'הועתק. אפשר להדביק בכל מקום', emoji: '📋' });
      } catch {
        store.showToast({ text: 'אפשר לסמן את הטקסט ולהעתיק ידנית', emoji: '✋' });
      }
    }
  }

  function saveEdit() {
    up({ title: title.trim() || item!.title, rawText: raw.trim() || item!.rawText });
    setEditing(false);
    store.showToast({ text: 'השינויים נשמרו', emoji: '✏️' });
  }

  const task = item.task;

  return (
    <div>
      <ScreenHeader
        title={c.name}
        emoji={c.emoji}
        actions={
          <>
            <IconButton label={item.favorite ? 'הסר ממועדפים' : 'הוסף למועדפים'} active={item.favorite} onClick={() => store.toggleFavorite(item.id)}>
              <Star size={20} fill={item.favorite ? 'currentColor' : 'none'} />
            </IconButton>
            <IconButton label="תזכורת" active={!!item.reminderAt && !item.reminderFired} onClick={() => setReminderOpen(true)}>
              <Bell size={20} fill={item.reminderAt && !item.reminderFired ? 'currentColor' : 'none'} />
            </IconButton>
            <IconButton label="שיתוף" onClick={share}>
              <Share2 size={20} />
            </IconButton>
            <IconButton label="עריכה" onClick={() => setEditing((e) => !e)}>
              <Pencil size={19} />
            </IconButton>
          </>
        }
      />

      <div className="flex flex-col gap-3">
        {!item.reviewed && (
          <div className="animate-pop-in rounded-3xl border border-brand/25 bg-brand-soft p-4">
            <p className="text-[15px]">
              המסדר שם את זה ב<b>{c.emoji} {c.name}</b>
              {item.confidence < 0.6 ? ', אבל לא בטוח. ' : '. '}
              זה המקום הנכון?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  up({ reviewed: true });
                  nav.markFiled(item.category);
                  store.showToast({ text: 'מעולה, מצא את הבית שלו', emoji: '🏡' });
                }}
                className="pressable inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 font-semibold text-brand-ink"
              >
                <Check size={17} /> כן, מעולה
              </button>
              <button onClick={() => setPicker(true)} className="pressable h-10 rounded-xl border border-brand/30 bg-surface px-4 font-semibold text-brand">
                להעביר לקטגוריה אחרת
              </button>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="px-1 pt-1">
          {editing ? (
            <input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-brand/50 bg-surface px-3 py-2 font-display text-[22px] font-semibold outline-none"
              aria-label="כותרת"
            />
          ) : (
            <div className="flex items-start gap-3">
              {task && (
                <div className="pt-1">
                  <TaskCheck item={item} size={30} />
                </div>
              )}
              <h1 className={`font-display text-[26px] font-semibold leading-tight ${task?.done ? 'text-muted line-through decoration-faint' : ''}`}>{item.title}</h1>
            </div>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <CategoryBadge id={item.category} size="md" onClick={() => setPicker(true)} />
            <button onClick={() => setPicker(true)} className="font-semibold text-brand hover:underline">
              שינוי קטגוריה
            </button>
            <span className="text-faint">·</span>
            <span>נשמר {formatFullDate(item.createdAt)}</span>
          </div>
        </div>

        {item.link && <LinkCard link={item.link} />}
        {item.image && <img src={item.image} alt={item.title} className="max-h-[420px] w-full rounded-3xl border border-line object-contain" />}

        {/* Reminder - available for every item */}
        <button
          onClick={() => setReminderOpen(true)}
          className={`pressable flex items-center gap-3 rounded-3xl border p-4 text-start ${item.reminderAt && !item.reminderFired ? 'border-brand/30 bg-brand-soft' : 'border-line/70 bg-surface shadow-soft'}`}
        >
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.reminderAt && !item.reminderFired ? 'bg-brand text-brand-ink' : 'bg-sunken text-brand'}`}>
            <Bell size={20} />
          </span>
          <span className="flex-1">
            <span className="block font-display text-[16px] font-semibold">
              {item.reminderAt && !item.reminderFired ? `תזכורת ${formatReminder(item.reminderAt)}` : 'הוספת תזכורת'}
            </span>
            <span className="block text-[13px] text-muted">
              {item.reminderAt && !item.reminderFired ? 'לחצו כדי לשנות או לבטל' : 'צלצול ותזכורת בזמן שתבחרו'}
            </span>
          </span>
        </button>
        <ReminderSheet item={item} open={reminderOpen} onClose={() => setReminderOpen(false)} />

        {/* Task */}
        {task && (
          <Block title="פרטי המשימה" icon={<CalendarDays size={16} />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-[13px] font-semibold text-muted">
                תאריך יעד
                <input
                  id="due-date"
                  type="date"
                  value={task.dueDate ?? ''}
                  onChange={(e) => up((i) => ({ task: { ...i.task!, dueDate: e.target.value || undefined, reminderFired: false } }))}
                  className="h-11 rounded-xl border border-line bg-bg px-3 text-[16px] text-ink outline-none focus:border-brand/60"
                />
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-semibold text-muted">
                שעה
                <input
                  id="due-time"
                  type="time"
                  value={task.dueTime ?? ''}
                  onChange={(e) => up((i) => ({ task: { ...i.task!, dueTime: e.target.value || undefined } }))}
                  className="h-11 rounded-xl border border-line bg-bg px-3 text-[16px] text-ink outline-none focus:border-brand/60"
                />
              </label>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[0, 1, 7].map((d) => {
                const date = new Date();
                date.setDate(date.getDate() + d);
                const iso = toISODate(date);
                return (
                  <button
                    key={d}
                    onClick={() => up((i) => ({ task: { ...i.task!, dueDate: iso, reminderFired: false } }))}
                    className={`rounded-full px-3 py-1 text-[13px] font-semibold ${task.dueDate === iso ? 'bg-brand text-brand-ink' : 'bg-sunken text-muted hover:text-ink'}`}
                  >
                    {d === 0 ? 'היום' : d === 1 ? 'מחר' : 'בעוד שבוע'}
                  </button>
                );
              })}
              {task.dueDate && (
                <button onClick={() => up((i) => ({ task: { ...i.task!, dueDate: undefined, dueTime: undefined, } }))} className="rounded-full px-3 py-1 text-[13px] font-semibold text-muted hover:text-danger">
                  בלי תאריך
                </button>
              )}
            </div>


            <div className="mt-4">
              <div className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-muted">
                <Flag size={14} /> חשיבות
              </div>
              <Segmented<Priority>
                size="sm"
                value={task.priority}
                onChange={(p) => up((i) => ({ task: { ...i.task!, priority: p } }))}
                options={[
                  { value: 'low', label: 'נמוכה' },
                  { value: 'medium', label: 'רגילה' },
                  { value: 'high', label: '🔥 גבוהה' },
                ]}
              />
            </div>
            <button
              onClick={() => store.toggleTask(item.id)}
              className={`pressable mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold ${task.done ? 'bg-sunken text-ink' : 'bg-done text-white'}`}
            >
              <Check size={18} /> {task.done ? 'להחזיר למשימות פתוחות' : 'סימון כבוצע'}
            </button>
            {task.dueDate && !task.done && <p className="mt-2 text-center text-[13px] text-muted">יעד: {formatDue(task.dueDate)} {task.dueTime}</p>}
          </Block>
        )}

        {/* Shopping checklist */}
        {item.checklist ? (
          <Block title="רשימת קניות" icon={<ListChecks size={16} />}>
            <Checklist item={item} />
          </Block>
        ) : (
          item.category === 'shopping' && (
            <button
              onClick={() => {
                const list = parseListItems(item.rawText);
                up({ checklist: (list.length ? list : [item.title]).map((text) => ({ id: uid(), text, checked: false })) });
              }}
              className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-line font-semibold text-muted hover:text-ink"
            >
              <ListChecks size={18} /> להפוך לרשימה עם סימונים
            </button>
          )
        )}

        {/* Original message */}
        <Block
          title="ההודעה המקורית"
          action={
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(item.rawText);
                  store.showToast({ text: 'הטקסט הועתק', emoji: '📋' });
                } catch {
                  store.showToast({ text: 'אפשר לסמן את הטקסט ולהעתיק ידנית', emoji: '✋' });
                }
              }}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-ink"
            >
              <Copy size={13} /> העתקה
            </button>
          }
        >
          {editing ? (
            <textarea
              id="edit-raw"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-brand/50 bg-bg p-3 text-[16px] leading-relaxed outline-none"
            />
          ) : (
            <div className="rounded-2xl rounded-tr-md bg-[rgb(var(--c-shopping-bg))] px-4 py-3">
              <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed">
                {item.rawText.split(/(https?:\/\/\S+)/).map((part, i) =>
                  /^https?:\/\//.test(part) ? (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="ltr break-all text-[rgb(var(--c-readlater-ink))] underline">
                      {part}
                    </a>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
              </p>
              <p className="tabular mt-1 text-start text-[12px] text-muted">
                {new Date(item.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} ✓✓
              </p>
            </div>
          )}
          {editing && (
            <div className="mt-3 flex gap-2">
              <button onClick={saveEdit} className="pressable h-10 rounded-xl bg-brand px-5 font-semibold text-brand-ink">
                שמירה
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setTitle(item.title);
                  setRaw(item.rawText);
                }}
                className="h-10 rounded-xl px-4 font-semibold text-muted hover:bg-sunken"
              >
                ביטול
              </button>
            </div>
          )}
          {item.summary && !item.link && !editing && <p className="mt-3 text-[14px] text-muted">תקציר: {item.summary}</p>}
          {item.url && !item.link && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
              <ExternalLink size={14} /> פתיחת הקישור
            </a>
          )}
        </Block>

        <Block title="תגיות">
          <TagEditor tags={item.tags} onChange={(tags) => up({ tags })} />
        </Block>

        <Block title="הערות אישיות">
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== item.notes && up({ notes })}
            rows={3}
            placeholder="למשל: דנה המליצה, לבדוק מחירים, להכין לשבת..."
            className="w-full resize-none rounded-xl border border-line bg-bg p-3 text-[16px] leading-relaxed outline-none placeholder:text-faint focus:border-brand/60"
          />
          {notes !== item.notes && <p className="mt-1 text-[12px] text-faint">נשמר אוטומטית כשיוצאים מהשדה</p>}
        </Block>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button onClick={share} className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-surface font-semibold">
            <Share2 size={17} /> שיתוף
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-surface font-semibold"
          >
            <MessageCircle size={17} /> לוואטסאפ
          </a>
          <button onClick={() => setPicker(true)} className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-surface font-semibold">
            <span aria-hidden>📂</span> העברה
          </button>
          {confirmDelete ? (
            <button
              onClick={() => {
                store.remove(item.id);
                nav.back();
              }}
              className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl bg-danger font-semibold text-white"
            >
              <Trash2 size={17} /> בטוח? למחוק
            </button>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger-soft font-semibold text-danger">
              <Trash2 size={17} /> מחיקה
            </button>
          )}
        </div>
      </div>

      <CategoryPicker open={picker} current={item.category} onPick={moveTo} onClose={() => setPicker(false)} />
      <Footer />
    </div>
  );
}
