import { useEffect, useState } from 'react';
import { BellOff, BellRing } from 'lucide-react';
import type { Item } from '../lib/types';
import { useStore } from '../state/store';
import { askNotificationPermission, formatReminder, isNative, playReminderSound, REMINDER_PRESETS, unlockAudio } from '../lib/reminders';
import { toISODate } from '../lib/dates';
import { Sheet } from './ui';
import { L } from '../lib/i18n';

const pad = (n: number) => String(n).padStart(2, '0');

/** Bottom sheet for setting a reminder on any item: quick picks or an exact date and time. */
export function ReminderSheet({ item, open, onClose }: { item: Item; open: boolean; onClose: () => void }) {
  const { update, showToast, settings } = useStore();
  const now = new Date();
  const base = item.reminderAt ? new Date(item.reminderAt) : new Date(now.getTime() + 60 * 60_000);
  const [date, setDate] = useState(toISODate(base));
  const [time, setTime] = useState(`${pad(base.getHours())}:${pad(base.getMinutes())}`);

  useEffect(() => {
    if (!open) return;
    const b = item.reminderAt ? new Date(item.reminderAt) : new Date(Date.now() + 60 * 60_000);
    setDate(toISODate(b));
    setTime(`${pad(b.getHours())}:${pad(b.getMinutes())}`);
  }, [open, item.reminderAt]);

  const set = (at: Date) => {
    if (at.getTime() <= Date.now()) {
      showToast({ text: L('הזמן הזה כבר עבר. בחרו זמן בעתיד', 'That time has passed. Pick a time in the future'), emoji: '🕰️' });
      return;
    }
    unlockAudio();
    update(item.id, { reminderAt: at.toISOString(), reminderFired: false });
    askNotificationPermission();
    showToast({ text: L(`נזכיר לך ${formatReminder(at.toISOString())}`, `We'll remind you ${formatReminder(at.toISOString())}`), emoji: '⏰' });
    onClose();
  };

  const due = item.task?.dueDate ? new Date(`${item.task.dueDate}T${item.task.dueTime ?? '09:00'}`) : null;
  const presets = [
    ...(due && due.getTime() > now.getTime() ? [{ id: 'due', label: L('בזמן היעד', 'At the due time'), at: () => due }] : []),
    ...REMINDER_PRESETS,
  ];

  return (
    <Sheet open={open} onClose={onClose} title={L('תזכורת', 'Reminder')}>
      <p className="-mt-1 mb-3 line-clamp-2 text-[15px] text-muted">{item.title}</p>

      {item.reminderAt && !item.reminderFired && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-brand-soft p-3">
          <BellRing size={20} className="shrink-0 text-brand" />
          <div className="flex-1 text-[15px]">
            {L('תזכורת קבועה ל', 'Reminder set for ')}<b>{formatReminder(item.reminderAt)}</b>
          </div>
          <button
            onClick={() => {
              update(item.id, { reminderAt: undefined, reminderFired: undefined });
              showToast({ text: L('התזכורת בוטלה', 'Reminder cancelled'), emoji: '🔕' });
              onClose();
            }}
            className="pressable inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold text-danger hover:bg-surface"
          >
            <BellOff size={15} /> {L('ביטול', 'Cancel')}
          </button>
        </div>
      )}

      <div className="mb-2 text-[13px] font-semibold text-muted">{L('מתי להזכיר?', 'When should we remind you?')}</div>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => set(p.at(new Date()))}
            className="pressable h-12 rounded-2xl border border-line bg-surface px-3 text-[15px] font-semibold hover:border-brand/50 hover:bg-brand-soft"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-2 mt-5 text-[13px] font-semibold text-muted">{L('או תאריך ושעה מדויקים', 'Or an exact date and time')}</div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          type="date"
          aria-label={L('תאריך התזכורת', 'Reminder date')}
          value={date}
          min={toISODate(now)}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 min-w-0 rounded-xl border border-line bg-bg px-3 text-[16px] text-ink outline-none focus:border-brand/60"
        />
        <input
          type="time"
          aria-label={L('שעת התזכורת', 'Reminder time')}
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="h-12 w-[120px] rounded-xl border border-line bg-bg px-3 text-[16px] text-ink outline-none focus:border-brand/60"
        />
      </div>
      <button
        onClick={() => date && time && set(new Date(`${date}T${time}`))}
        className="pressable mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand font-display text-[16px] font-semibold text-brand-ink shadow-fab"
      >
        <BellRing size={18} /> {L('קביעת תזכורת', 'Set reminder')}
      </button>

      <button
        onClick={() => {
          unlockAudio();
          playReminderSound(settings.reminderSound === 'none' ? 'bell' : settings.reminderSound, 1);
        }}
        className="mx-auto mt-3 block text-[13px] font-semibold text-brand hover:underline"
      >
        🔊 {L('השמעת הצליל לבדיקה', 'Play the sound to test')}
      </button>

      {!isNative() && (
        <p className="mt-3 rounded-2xl bg-sunken p-3 text-[13px] leading-relaxed text-muted">
          {L('בגרסת האתר התזכורת מצלצלת כשהמסדר פתוח. כדי שתצלצל גם כשהוא סגור, התקינו את אפליקציית האנדרואיד (כפתור "התקנה" במסך הבית).', 'On the website, reminders ring while Hamesader is open. To have them ring even when it is closed, install the Android app (the "Install" button on the home screen).')}
        </p>
      )}
    </Sheet>
  );
}
