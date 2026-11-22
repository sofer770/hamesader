import { useState, type ReactNode } from 'react';
import { Copy, Monitor, Moon, RotateCcw, Sparkles, Sun, Trash2 } from 'lucide-react';
import { useStore } from '../state/store';
import { initials } from '../lib/initials';
import { useNav } from '../state/nav';
import { classifier } from '../services/classifier';
import { InstallCard, InstalledBadge } from '../components/InstallCard';
import { playReminderSound, REMINDER_SOUNDS, unlockAudio } from '../lib/reminders';
import { Footer, Logo, ScreenHeader, Segmented, TagChip } from '../components/ui';

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
      <ScreenHeader title="פרופיל והגדרות" />
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 rounded-3xl bg-hero p-5 text-hero-ink shadow-fab">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 font-display text-3xl font-bold">{initials(settings.name)}</div>
          <div className="min-w-0">
            <div className="font-display text-xl font-semibold">{settings.name || 'שלום!'}</div>
            <div className="tabular text-[14px] opacity-85">
              {items.length} פריטים שמורים · {open} משימות פתוחות · {favs} מועדפים
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { n: items.length, l: 'פריטים' },
            { n: done, l: 'משימות שהושלמו' },
            { n: allTags.length, l: 'תגיות' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-line/70 bg-surface p-3 text-center">
              <div className="tabular font-display text-2xl font-semibold text-brand">{s.n}</div>
              <div className="text-[12px] text-muted">{s.l}</div>
            </div>
          ))}
        </div>

        <InstallCard />
        <InstalledBadge />

        <Card title="איך לקרוא לך?">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                updateSettings({ name: name.trim(), nameAsked: true });
                store.showToast({ text: `נעים להכיר, ${name.trim()}`, emoji: '👋' });
              }
            }}
            className="flex gap-2"
          >
            <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 text-[16px] outline-none focus:border-brand/60" />
            <button type="submit" className="pressable h-11 rounded-xl bg-brand px-4 font-semibold text-brand-ink">
              שמירה
            </button>
          </form>
        </Card>

        <Card title="צליל התזכורות">
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
          <p className="mt-2 text-[13px] text-muted">לוחצים על צליל כדי לשמוע אותו. הצליל נשמע כשמגיע זמן התזכורת, יחד עם רטט.</p>
        </Card>

        <Card title="מראה">
          <Segmented
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'system', label: <><Monitor size={15} /> לפי המכשיר</> },
              { value: 'light', label: <><Sun size={15} /> בהיר</> },
              { value: 'dark', label: <><Moon size={15} /> כהה</> },
            ]}
          />
        </Card>

        <Card title="התגיות שלי">
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
            <input id="new-tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="תגית חדשה, למשל: רכב" className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 text-[15px] outline-none focus:border-brand/60" />
            <button type="submit" disabled={!newTag.trim()} className="pressable h-10 rounded-xl bg-sunken px-4 font-semibold disabled:opacity-40">
              הוספה
            </button>
          </form>
        </Card>

        <Card title="לשלוח למסדר ישר מוואטסאפ">
          <ol className="flex list-inside list-decimal flex-col gap-1.5 text-[15px] text-muted marker:font-semibold marker:text-brand">
            <li>מתקינים את המסדר בטלפון (הכפתור "התקנה" למעלה).</li>
            <li>בוואטסאפ לוחצים לחיצה ארוכה על הודעה או קישור ← שיתוף.</li>
            <li>בוחרים "המסדר", והפריט נכנס לתיבת הקליטה כבר ממוין.</li>
          </ol>
          <p className="mt-2 text-[13px] text-faint">באנדרואיד זה עובד ישירות מתפריט השיתוף. באייפון אפשר בינתיים להעתיק ולהדביק בכפתור הפלוס.</p>
        </Card>

        <Card title="המיון החכם">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <Sparkles size={18} />
            </span>
            <p className="text-[15px] text-muted">
              מנוע פעיל: <b className="text-ink">{classifier.name}</b>. מזהה עברית מדוברת, קיצורים ושגיאות כתיב, תאריכים ("מחר", "ביום ראשון", "30/11") ורשימות קניות. המנוע בנוי כך שאפשר לחבר אליו מודל AI מלא בשרת, בלי לשנות את האפליקציה.
            </p>
          </div>
        </Card>

        <Card title="הנתונים שלך">
          <p className="mb-3 text-[14px] text-muted">בגרסה הזו הכל נשמר רק במכשיר הזה, בדפדפן.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(JSON.stringify(items, null, 2));
                  store.showToast({ text: 'גיבוי של כל הפריטים הועתק', emoji: '📋' });
                } catch {
                  store.showToast({ text: 'הדפדפן חסם העתקה. נסו בדפדפן אחר', emoji: '⚠️' });
                }
              }}
              className="pressable inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 font-semibold"
            >
              <Copy size={16} /> העתקת גיבוי
            </button>
            <button onClick={store.resetDemo} className="pressable inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 font-semibold">
              <RotateCcw size={16} /> טעינת נתוני דוגמה
            </button>
            {confirmClear ? (
              <button
                onClick={() => {
                  store.clearAll();
                  setConfirmClear(false);
                }}
                className="pressable inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-danger px-4 font-semibold text-white"
              >
                <Trash2 size={16} /> כן, למחוק הכל
              </button>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="pressable inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 font-semibold text-danger">
                <Trash2 size={16} /> מחיקת כל הפריטים
              </button>
            )}
          </div>
        </Card>

        <div className="mt-2 flex items-center justify-center gap-2 text-[13px] text-faint">
          <Logo size={22} /> המסדר · גרסה 0.1
        </div>
      </div>
      <Footer />
    </div>
  );
}
