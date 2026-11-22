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
import { L } from '../lib/i18n';

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
        <ScreenHeader title={L('הפריט לא נמצא', 'Item not found')} />
        <EmptyState emoji="🫥" title={L('הפריט הזה כבר לא כאן', 'This item is no longer here')} text={L('אולי הוא נמחק. אפשר לחזור ולחפש משהו אחר.', 'It may have been deleted. You can go back and search for something else.')} />
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
    store.showToast({ text: L(`הועבר ל${CATEGORY_BY_ID[cat].name}`, `Moved to ${CATEGORY_BY_ID[cat].name}`), emoji: CATEGORY_BY_ID[cat].emoji });
  }

  const shareText = [item.title, item.url, item.notes].filter(Boolean).join('\n');

  async function share() {
    try {
      if ((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()) {
        const { Share } = await import('@capacitor/share');
        await Share.share({ title: item!.title, text: shareText, dialogTitle: L('שיתוף', 'Share') });
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
        store.showToast({ text: L('הועתק. אפשר להדביק בכל מקום', 'Copied. You can paste it anywhere'), emoji: '📋' });
      } catch {
        store.showToast({ text: L('אפשר לסמן את הטקסט ולהעתיק ידנית', 'You can select the text and copy it manually'), emoji: '✋' });
      }
    }
  }

  function saveEdit() {
    up({ title: title.trim() || item!.title, rawText: raw.trim() || item!.rawText });
    setEditing(false);
    store.showToast({ text: L('השינויים נשמרו', 'Changes saved'), emoji: '✏️' });
  }

  const task = item.task;

  return (
    <div>
      <ScreenHeader
        title={c.name}
        emoji={c.emoji}
        actions={
          <>
            <IconButton label={item.favorite ? L('הסר ממועדפים', 'Remove from favorites') : L('הוסף למועדפים', 'Add to favorites')} active={item.favorite} onClick={() => store.toggleFavorite(item.id)}>
              <Star size={20} fill={item.favorite ? 'currentColor' : 'none'} />
            </IconButton>
            <IconButton label={L('תזכורת', 'Reminder')} active={!!item.reminderAt && !item.reminderFired} onClick={() => setReminderOpen(true)}>
              <Bell size={20} fill={item.reminderAt && !item.reminderFired ? 'currentColor' : 'none'} />
            </IconButton>
            <IconButton label={L('שיתוף', 'Share')} onClick={share}>
              <Share2 size={20} />
            </IconButton>
            <IconButton label={L('עריכה', 'Edit')} onClick={() => setEditing((e) => !e)}>
              <Pencil size={19} />
            </IconButton>
          </>
        }
      />

      <div className="flex flex-col gap-3">
        {!item.reviewed && (
          <div className="animate-pop-in rounded-3xl border border-brand/25 bg-brand-soft p-4">
            <p className="text-[15px]">
              {L('המסדר שם את זה ב', 'Hamesader filed this in ')}
              <b>
                {c.emoji} {c.name}
              </b>
              {item.confidence < 0.6 ? L(', אבל לא בטוח. ', ", but isn't sure. ") : '. '}
              {L('זה המקום הנכון?', 'Is this the right place?')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  up({ reviewed: true });
                  nav.markFiled(item.category);
                  store.showToast({ text: L('מעולה, מצא את הבית שלו', 'Great, it found its home'), emoji: '🏡' });
                }}
                className="pressable inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 font-semibold text-brand-ink"
              >
                <Check size={17} /> {L('כן, מעולה', 'Yes, great')}
              </button>
              <button onClick={() => setPicker(true)} className="pressable h-10 rounded-xl border border-brand/30 bg-surface px-4 font-semibold text-brand">
                {L('להעביר לקטגוריה אחרת', 'Move to another category')}
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
              aria-label={L('כותרת', 'Title')}
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
              {L('שינוי קטגוריה', 'Change category')}
            </button>
            <span className="text-faint">·</span>
            <span>{L('נשמר', 'Saved')} {formatFullDate(item.createdAt)}</span>
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
              {item.reminderAt && !item.reminderFired ? L(`תזכורת ${formatReminder(item.reminderAt)}`, `Reminder ${formatReminder(item.reminderAt)}`) : L('הוספת תזכורת', 'Add a reminder')}
            </span>
            <span className="block text-[13px] text-muted">
              {item.reminderAt && !item.reminderFired ? L('לחצו כדי לשנות או לבטל', 'Tap to change or cancel') : L('צלצול ותזכורת בזמן שתבחרו', 'A ring and a reminder at the time you choose')}
            </span>
          </span>
        </button>
        <ReminderSheet item={item} open={reminderOpen} onClose={() => setReminderOpen(false)} />

        {/* Task */}
        {task && (
          <Block title={L('פרטי המשימה', 'Task details')} icon={<CalendarDays size={16} />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-[13px] font-semibold text-muted">
                {L('תאריך יעד', 'Due date')}
                <input
                  id="due-date"
                  type="date"
                  value={task.dueDate ?? ''}
                  onChange={(e) => up((i) => ({ task: { ...i.task!, dueDate: e.target.value || undefined, reminderFired: false } }))}
                  className="h-11 rounded-xl border border-line bg-bg px-3 text-[16px] text-ink outline-none focus:border-brand/60"
                />
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-semibold text-muted">
                {L('שעה', 'Time')}
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
                    {d === 0 ? L('היום', 'Today') : d === 1 ? L('מחר', 'Tomorrow') : L('בעוד שבוע', 'In a week')}
                  </button>
                );
              })}
              {task.dueDate && (
                <button onClick={() => up((i) => ({ task: { ...i.task!, dueDate: undefined, dueTime: undefined, } }))} className="rounded-full px-3 py-1 text-[13px] font-semibold text-muted hover:text-danger">
                  {L('בלי תאריך', 'No date')}
                </button>
              )}
            </div>


            <div className="mt-4">
              <div className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-muted">
                <Flag size={14} /> {L('חשיבות', 'Priority')}
              </div>
              <Segmented<Priority>
                size="sm"
                value={task.priority}
                onChange={(p) => up((i) => ({ task: { ...i.task!, priority: p } }))}
                options={[
                  { value: 'low', label: L('נמוכה', 'Low') },
                  { value: 'medium', label: L('רגילה', 'Normal') },
                  { value: 'high', label: L('🔥 גבוהה', '🔥 High') },
                ]}
              />
            </div>
            <button
              onClick={() => store.toggleTask(item.id)}
              className={`pressable mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold ${task.done ? 'bg-sunken text-ink' : 'bg-done text-white'}`}
            >
              <Check size={18} /> {task.done ? L('להחזיר למשימות פתוחות', 'Move back to open tasks') : L('סימון כבוצע', 'Mark as done')}
            </button>
            {task.dueDate && !task.done && <p className="mt-2 text-center text-[13px] text-muted">{L('יעד:', 'Due:')} {formatDue(task.dueDate)} {task.dueTime}</p>}
          </Block>
        )}

        {/* Shopping checklist */}
        {item.checklist ? (
          <Block title={L('רשימת קניות', 'Shopping list')} icon={<ListChecks size={16} />}>
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
              <ListChecks size={18} /> {L('להפוך לרשימה עם סימונים', 'Turn into a checklist')}
            </button>
          )
        )}

        {/* Original message */}
        <Block
          title={L('ההודעה המקורית', 'Original message')}
          action={
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(item.rawText);
                  store.showToast({ text: L('הטקסט הועתק', 'Text copied'), emoji: '📋' });
                } catch {
                  store.showToast({ text: L('אפשר לסמן את הטקסט ולהעתיק ידנית', 'You can select the text and copy it manually'), emoji: '✋' });
                }
              }}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-ink"
            >
              <Copy size={13} /> {L('העתקה', 'Copy')}
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
            <div className="rounded-2xl rounded-ss-md bg-[rgb(var(--c-shopping-bg))] px-4 py-3">
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
                {L('שמירה', 'Save')}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setTitle(item.title);
                  setRaw(item.rawText);
                }}
                className="h-10 rounded-xl px-4 font-semibold text-muted hover:bg-sunken"
              >
                {L('ביטול', 'Cancel')}
              </button>
            </div>
          )}
          {item.summary && !item.link && !editing && <p className="mt-3 text-[14px] text-muted">{L('תקציר:', 'Summary:')} {item.summary}</p>}
          {item.url && !item.link && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
              <ExternalLink size={14} /> {L('פתיחת הקישור', 'Open link')}
            </a>
          )}
        </Block>

        <Block title={L('תגיות', 'Tags')}>
          <TagEditor tags={item.tags} onChange={(tags) => up({ tags })} />
        </Block>

        <Block title={L('הערות אישיות', 'Personal notes')}>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== item.notes && up({ notes })}
            rows={3}
            placeholder={L('למשל: דנה המליצה, לבדוק מחירים, להכין לשבת...', 'e.g. Dana recommended it, check prices, make it for Saturday...')}
            className="w-full resize-none rounded-xl border border-line bg-bg p-3 text-[16px] leading-relaxed outline-none placeholder:text-faint focus:border-brand/60"
          />
          {notes !== item.notes && <p className="mt-1 text-[12px] text-faint">{L('נשמר אוטומטית כשיוצאים מהשדה', 'Saved automatically when you leave the box')}</p>}
        </Block>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button onClick={share} className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-surface font-semibold">
            <Share2 size={17} /> {L('שיתוף', 'Share')}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-surface font-semibold"
          >
            <MessageCircle size={17} /> {L('לוואטסאפ', 'To WhatsApp')}
          </a>
          <button onClick={() => setPicker(true)} className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-surface font-semibold">
            <span aria-hidden>📂</span> {L('העברה', 'Move')}
          </button>
          {confirmDelete ? (
            <button
              onClick={() => {
                store.remove(item.id);
                nav.back();
              }}
              className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl bg-danger font-semibold text-white"
            >
              <Trash2 size={17} /> {L('בטוח? למחוק', 'Sure? Delete')}
            </button>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger-soft font-semibold text-danger">
              <Trash2 size={17} /> {L('מחיקה', 'Delete')}
            </button>
          )}
        </div>
      </div>

      <CategoryPicker open={picker} current={item.category} onPick={moveTo} onClose={() => setPicker(false)} />
      <Footer />
    </div>
  );
}
