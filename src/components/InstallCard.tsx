import { useEffect, useState } from 'react';
import { Copy, Download, Smartphone, X } from 'lucide-react';
import { canPromptInstall, canShowInstallHelp, isIOS, onInstallChange, promptInstall } from '../lib/pwa';
import { useStore } from '../state/store';
import { Logo, Sheet } from './ui';

export const APK_URL = 'https://github.com/sofer770/hamesader/releases/download/latest/hamesader.apk';
const KEY = 'hamesader.installDismissed';

const isAndroid = () => /android/i.test(navigator.userAgent);
/** WhatsApp / Facebook / Instagram open links in their own mini-browser, which cannot install apps. */
const isInAppBrowser = () => /FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)/i.test(navigator.userAgent);

function useInstallState() {
  const [, force] = useState(0);
  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);
  return { visible: canShowInstallHelp(), oneTap: canPromptInstall() };
}

/** Opens the right install flow for this phone: one tap where the browser allows it, otherwise a short guide. */
function useInstallAction() {
  const { showToast } = useStore();
  const [sheet, setSheet] = useState(false);
  const run = async () => {
    if (canPromptInstall()) {
      if (await promptInstall()) showToast({ text: 'המסדר הותקן. אפשר לפתוח מהאייקון', emoji: '📲' });
      return;
    }
    setSheet(true);
  };
  return { run, sheet, closeSheet: () => setSheet(false) };
}

const readDismissed = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};
const DISMISS_EVENT = 'hamesader-install-dismissed';

/** Small header button. Shown only after the big card was closed, so there is always exactly one install button. */
export function InstallButton() {
  const { visible } = useInstallState();
  const { run, sheet, closeSheet } = useInstallAction();
  const [dismissed, setDismissed] = useState(readDismissed);
  useEffect(() => {
    const on = () => setDismissed(true);
    window.addEventListener(DISMISS_EVENT, on);
    return () => window.removeEventListener(DISMISS_EVENT, on);
  }, []);
  if (!visible || !dismissed) return null;
  return (
    <>
      <button
        onClick={run}
        className="pressable inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[rgb(var(--done))] px-4 font-display text-[15px] font-semibold text-white shadow-soft"
      >
        <Download size={17} strokeWidth={2.5} /> התקנה
      </button>
      <InstallSheet open={sheet} onClose={closeSheet} />
    </>
  );
}

export function InstallCard({ dismissible = false }: { dismissible?: boolean }) {
  const { visible } = useInstallState();
  const { run, sheet, closeSheet } = useInstallAction();
  const [hidden, setHidden] = useState(() => dismissible && readDismissed());
  if (hidden || !visible) return null;

  return (
    <div className="relative flex items-center gap-3 rounded-3xl border-2 border-[rgb(var(--done))]/30 bg-done-soft p-4">
      <Logo size={52} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-[17px] font-semibold">התקינו את המסדר בטלפון</div>
        <p className="text-[14px] text-muted">אייקון במסך הבית, נפתח במסך מלא ועובד גם בלי אינטרנט.</p>
        <button onClick={run} className="pressable mt-2.5 inline-flex h-11 items-center gap-2 rounded-xl bg-[rgb(var(--done))] px-5 font-display font-semibold text-white">
          <Download size={18} /> התקנה בלחיצה
        </button>
      </div>
      {dismissible && (
        <button
          onClick={() => {
            setHidden(true);
            try {
              localStorage.setItem(KEY, '1');
            } catch {
              /* ignore */
            }
            window.dispatchEvent(new Event(DISMISS_EVENT));
          }}
          className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-surface"
          aria-label="סגירה"
        >
          <X size={16} />
        </button>
      )}
      <InstallSheet open={sheet} onClose={closeSheet} />
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand font-display font-bold text-brand-ink">{n}</span>
      <span className="pt-1 text-[16px] leading-snug">{children}</span>
    </li>
  );
}

function InstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showToast } = useStore();
  const ios = isIOS();
  const android = isAndroid();
  const inApp = isInAppBrowser();
  const link = typeof location !== 'undefined' ? location.origin + location.pathname : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showToast({ text: 'הקישור הועתק', emoji: '📋' });
    } catch {
      showToast({ text: link, emoji: '🔗' });
    }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="mb-4 flex items-center gap-3">
        <Logo size={48} />
        <div>
          <h2 className="font-display text-xl font-semibold">התקנת המסדר</h2>
          <p className="text-[14px] text-muted">{ios ? 'באייפון זה לוקח 3 לחיצות' : 'לוקח פחות מדקה'}</p>
        </div>
      </div>

      {android && (
        <div className="flex flex-col gap-4">
          <a
            href={APK_URL}
            className="pressable flex h-14 items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--done))] font-display text-[18px] font-semibold text-white shadow-soft"
          >
            <Download size={22} /> הורדת האפליקציה
          </a>
          <ol className="flex flex-col gap-3">
            <Step n={1}>לוחצים על הכפתור הירוק, וההורדה מתחילה.</Step>
            <Step n={2}>
              כשההורדה מסתיימת לוחצים <b>"פתיחה"</b> ואז <b>"התקנה"</b>.
            </Step>
            <Step n={3}>
              אם הטלפון שואל, מאשרים <b>"אפשר ממקור זה"</b> או <b>"התקן בכל זאת"</b>. זה רגיל לאפליקציה שלא מגוגל פליי.
            </Step>
          </ol>
          <p className="rounded-2xl bg-sunken p-3 text-[14px] text-muted">
            בונוס: אחרי ההתקנה, בוואטסאפ לוחצים לחיצה ארוכה על הודעה ← שיתוף ← <b className="text-ink">המסדר</b>, והיא נשמרת ממוינת.
          </p>
        </div>
      )}

      {ios && inApp && (
        <div className="flex flex-col gap-4">
          <p className="rounded-2xl bg-warn-soft p-3 text-[15px] font-semibold text-ink">
            הדף נפתח בתוך וואטסאפ, ומשם אי אפשר להתקין. צריך לפתוח אותו בספארי:
          </p>
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              לוחצים על <b>⋯</b> או על סמל המצפן 🧭 בפינת המסך ובוחרים <b>"פתיחה בספארי"</b>.
            </Step>
            <Step n={2}>בספארי לוחצים שוב על "התקנה".</Step>
          </ol>
          <button onClick={copyLink} className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl border border-line font-semibold">
            <Copy size={17} /> או: העתקת הקישור להדבקה בספארי
          </button>
        </div>
      )}

      {ios && !inApp && (
        <div className="flex flex-col gap-4">
          <ol className="flex flex-col gap-4">
            <Step n={1}>
              לוחצים על כפתור השיתוף{' '}
              <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-sunken align-middle text-[15px]" aria-hidden>
                ⬆️
              </span>{' '}
              בתחתית המסך.
            </Step>
            <Step n={2}>
              גוללים מעט ובוחרים <b>"הוספה למסך הבית"</b>{' '}
              <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-sunken align-middle" aria-hidden>
                ➕
              </span>
            </Step>
            <Step n={3}>
              לוחצים <b>"הוסף"</b> למעלה. האייקון של המסדר יופיע במסך הבית.
            </Step>
          </ol>
          <div className="flex flex-col items-center pt-1 text-brand" aria-hidden>
            <span className="text-[13px] font-semibold">כפתור השיתוף נמצא כאן למטה</span>
            <span className="animate-bounce text-3xl">⬇️</span>
          </div>
        </div>
      )}

      {!ios && !android && (
        <div className="flex flex-col gap-4">
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              בשורת הכתובת של Chrome או Edge לוחצים על סמל ההתקנה <Smartphone size={16} className="inline" /> (בצד ימין של הכתובת).
            </Step>
            <Step n={2}>
              מאשרים <b>"התקנה"</b>, והמסדר נפתח כאפליקציה נפרדת.
            </Step>
          </ol>
          <p className="text-[14px] text-muted">בטלפון אנדרואיד אפשר להוריד את האפליקציה ישירות מהכפתור באותו מסך.</p>
        </div>
      )}

      <button onClick={onClose} className="mt-5 h-11 w-full rounded-xl font-semibold text-muted hover:bg-sunken">
        סגירה
      </button>
    </Sheet>
  );
}
