import { useState, type ReactNode } from 'react';
import { Copy, Monitor, Moon, RotateCcw, Sparkles, Sun, Trash2 } from 'lucide-react';
import { useStore } from '../state/store';
import { initials } from '../lib/initials';
import { useNav } from '../state/nav';
import { classifier } from '../services/classifier';
import { InstallCard, InstalledBadge } from '../components/InstallCard';
import { playReminderSound, REMINDER_SOUNDS, unlockAudio } from '../lib/reminders';
import { Footer, Logo, ScreenHeader, Segmented, TagChip } from '../components/ui';
import { L, lang, setLang } from '../lib/i18n';

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line/70 bg-surface p-4 shadow-soft">
      <h2 className="mb-3 font-display text-[16px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function ProfileScreen() {
  const store = useStore();
  const nav = useNav();
  const { settings, updateSettings, items, allTags } = store;
  const [name, setName] = useState(settings.name);
  const [confirmClear, setConfirmClear] = useState(false);
  const [newTag, setNewTag] = useState('');

  const open = items.filter((i) => i.task && !i.task.done).length;
  const done = items.filter((i) => i.task?.done).length;
  const favs = items.filter((i) => i.favorite).length;

  return (
    <div>
      <ScreenHeader title={L('פרופיל והגדרות', 'Profile and settings')} />
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 rounded-3xl bg-hero p-5 text-hero-ink shadow-fab">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 font-display text-3xl font-bold">{initials(settings.name)}</div>
          <div className="min-w-0">
            <div className="font-display text-xl font-semibold">{settings.name || L('שלום!', 'Hello!')}</div>
            <div className="tabular text-[14px] opacity-85">
              {L(`${items.length} פריטים שמורים · ${open} משימות פתוחות · ${favs} מועדפים`, `${items.length} saved items · ${open} open tasks · ${favs} favorites`)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { n: items.length, l: L('פריטים', 'Items') },
            { n: done, l: L('משימות שהושלמו', 'Tasks completed') },
            { n: allTags.length, l: L('תגיות', 'Tags') },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-line/70 bg-surface p-3 text-center">
              <div className="tabular font-display text-2xl font-semibold text-brand">{s.n}</div>
              <div className="text-[12px] text-muted">{s.l}</div>
            </div>
          ))}
        </div>

        <InstallCard />
        <InstalledBadge />

        <Card title={L('שפה', 'Language')}>
          <Segmented
            value={lang}
            onChange={(v) => v !== lang && setLang(v)}
            options={[
              { value: 'he', label: 'עברית' },
              { value: 'en', label: 'English' },
            ]}
          />
        </Card>

        <Card title={L('איך לקרוא לך?', 'What should we call you?')}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                updateSettings({ name: name.trim(), nameAsked: true });
                store.showToast({ text: L(`נעים להכיר, ${name.trim()}`, `Nice to meet you, ${name.trim()}`), emoji: '👋' });
              }
            }}
            className="flex gap-2"
          >
            <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 text-[16px] outline-none focus:border-brand/60" />
            <button type="submit" className="pressable h-11 rounded-xl bg-brand px-4 font-semibold text-brand-ink">
              {L('שמירה', 'Save')}
            </button>
          </form>
        </Card>

        <Card title={L('צליל התזכורות', 'Reminder sound')}>
          <div className="grid grid-cols-4 gap-2">
            {REMINDER_SOUNDS.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  unlockAudio();
                  updateSettings({ reminderSound: s.value });
                  playReminderSound(s.value, 1);
                }}
                aria-pressed={settings.reminderSound === s.value}
                className={`pressable flex flex-col items-center gap-1 rounded-2xl border py-3 text-[14px] font-semibold ${settings.reminderSound === s.value ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-bg text-muted'}`}
              >
                <span className="text-xl" aria-hidden>{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-muted">{L('לוחצים על צליל כדי לשמוע אותו. הצליל נשמע כשמגיע זמן התזכורת, יחד עם רטט.', 'Tap a sound to hear it. It plays when a reminder is due, together with a vibration.')}</p>
        </Card>

        <Card title={L('מראה', 'Appearance')}>
          <Segmented
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'system', label: <><Monitor size={15} /> {L('לפי המכשיר', 'Device')}</> },
              { value: 'light', label: <><Sun size={15} /> {L('בהיר', 'Light')}</> },
              { value: 'dark', label: <><Moon size={15} /> {L('כהה', 'Dark')}</> },
            ]}
          />
        </Card>

        <Card title={L('התגיות שלי', 'My tags')}>
          <div className="flex flex-wrap gap-2">
            {allTags.map((t) => (
              <TagChip
                key={t}
                tag={`${t} · ${items.filter((i) => i.tags.includes(t)).length}`}
                onClick={() => nav.go({ name: 'tag', tag: t })}
                onRemove={settings.customTags.includes(t) ? () => updateSettings({ customTags: settings.customTags.filter((x) => x !== t) }) : undefined}
              />
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = newTag.trim().replace(/^#/, '');
              if (t && !allTags.includes(t)) updateSettings({ customTags: [...settings.customTags, t] });
              setNewTag('');
            }}
            className="mt-3 flex gap-2"
          >
            <input id="new-tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder={L('תגית חדשה, למשל: רכב', 'New tag, e.g. car')} className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 text-[15px] outline-none focus:border-brand/60" />
            <button type="submit" disabled={!newTag.trim()} className="pressable h-10 rounded-xl bg-sunken px-4 font-semibold disabled:opacity-40">
              {L('הוספה', 'Add')}
            </button>
          </form>
        </Card>

        <Card title={L('לשלוח למסדר ישר מוואטסאפ', 'Send to Hamesader straight from WhatsApp')}>
          <ol className="flex list-inside list-decimal flex-col gap-1.5 text-[15px] text-muted marker:font-semibold marker:text-brand">
            <li>{L('מתקינים את המסדר בטלפון (הכפתור "התקנה" למעלה).', 'Install Hamesader on your phone (the "Install" button above).')}</li>
            <li>{L('בוואטסאפ לוחצים לחיצה ארוכה על הודעה או קישור ← שיתוף.', 'In WhatsApp, long-press a message or link → Share.')}</li>
            <li>{L('בוחרים "המסדר", והפריט נכנס לתיבת הקליטה כבר ממוין.', 'Choose "Hamesader", and the item lands in your inbox already sorted.')}</li>
          </ol>
          <p className="mt-2 text-[13px] text-faint">{L('באנדרואיד זה עובד ישירות מתפריט השיתוף. באייפון אפשר בינתיים להעתיק ולהדביק בכפתור הפלוס.', 'On Android this works straight from the Share menu. On iPhone, for now, copy and paste with the plus button.')}</p>
        </Card>

        <Card title={L('המיון החכם', 'Smart sorting')}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <Sparkles size={18} />
            </span>
            <p className="text-[15px] text-muted">
              {L('מנוע פעיל:', 'Active engine:')} <b className="text-ink">{classifier.name}</b>.{' '}
              {L(
                'מזהה עברית מדוברת, קיצורים ושגיאות כתיב, תאריכים ("מחר", "ביום ראשון", "30/11") ורשימות קניות. המנוע בנוי כך שאפשר לחבר אליו מודל AI מלא בשרת, בלי לשנות את האפליקציה.',
                'Understands everyday Hebrew and English, abbreviations and typos, dates ("tomorrow", "on Sunday", "30/11") and shopping lists. It is built so a full AI model can be connected on the server without changing the app.',
              )}
            </p>
          </div>
        </Card>

        <Card title={L('הנתונים שלך', 'Your data')}>
          <p className="mb-3 text-[14px] text-muted">{L('בגרסה הזו הכל נשמר רק במכשיר הזה, בדפדפן.', 'In this version everything is saved only on this device, in the browser.')}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(JSON.stringify(items, null, 2));
                  store.showToast({ text: L('גיבוי של כל הפריטים הועתק', 'A backup of all items was copied'), emoji: '📋' });
                } catch {
                  store.showToast({ text: L('הדפדפן חסם העתקה. נסו בדפדפן אחר', 'The browser blocked copying. Try another browser'), emoji: '⚠️' });
                }
              }}
              className="pressable inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 font-semibold"
            >
              <Copy size={16} /> {L('העתקת גיבוי', 'Copy backup')}
            </button>
            <button onClick={store.resetDemo} className="pressable inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 font-semibold">
              <RotateCcw size={16} /> {L('טעינת נתוני דוגמה', 'Load sample data')}
            </button>
            {confirmClear ? (
              <button
                onClick={() => {
                  store.clearAll();
                  setConfirmClear(false);
                }}
                className="pressable inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-danger px-4 font-semibold text-white"
              >
                <Trash2 size={16} /> {L('כן, למחוק הכל', 'Yes, delete everything')}
              </button>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="pressable inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 font-semibold text-danger">
                <Trash2 size={16} /> {L('מחיקת כל הפריטים', 'Delete all items')}
              </button>
            )}
          </div>
        </Card>

        <div className="mt-2 flex items-center justify-center gap-2 text-[13px] text-faint">
          <Logo size={22} /> {L('המסדר · גרסה 0.1', 'Hamesader · version 0.1')}
        </div>
      </div>
      <Footer />
    </div>
  );
}
