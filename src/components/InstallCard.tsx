import { useEffect, useState } from 'react';
import { Copy, Download, Smartphone, X } from 'lucide-react';
import { canPromptInstall, canShowInstallHelp, isIOS, isStandalone, onInstallChange, promptInstall } from '../lib/pwa';
import { useStore } from '../state/store';
import { Logo, Sheet } from './ui';
import { isEn, L } from '../lib/i18n';

// Served from the site itself (fast in Israel); GitHub keeps a backup copy at releases/latest
export const APK_URL = `${((import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://el-habriut.co.il/hamesader').replace(/\/$/, '')}/app/hamesader.apk`;
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
      if (await promptInstall()) showToast({ text: L('המסדר הותקן. אפשר לפתוח מהאייקון', 'Hamesader is installed. Open it from the icon'), emoji: '📲' });
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
        className="pressable mt-2 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[rgb(var(--done))] px-3.5 font-display text-[14px] font-semibold text-white shadow-soft"
      >
        <Download size={17} strokeWidth={2.5} /> {L('התקנה', 'Install')}
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
        <div className="font-display text-[17px] font-semibold">{L('התקינו את המסדר בטלפון', 'Install Hamesader on your phone')}</div>
        <p className="text-[14px] text-muted">{L('אייקון במסך הבית, נפתח במסך מלא ועובד גם בלי אינטרנט.', 'An icon on your home screen, opens full screen and works offline too.')}</p>
        <button onClick={run} className="pressable mt-2.5 inline-flex h-11 items-center gap-2 rounded-xl bg-[rgb(var(--done))] px-5 font-display font-semibold text-white">
          <Download size={18} /> {L('התקנה בלחיצה', 'One-tap install')}
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
          className="absolute end-2 top-2 grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-surface"
          aria-label={L('סגירה', 'Close')}
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
      showToast({ text: L('הקישור הועתק', 'Link copied'), emoji: '📋' });
    } catch {
      showToast({ text: link, emoji: '🔗' });
    }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="mb-4 flex items-center gap-3">
        <Logo size={48} />
        <div>
          <h2 className="font-display text-xl font-semibold">{L('התקנת המסדר', 'Install Hamesader')}</h2>
          <p className="text-[14px] text-muted">{ios ? L('באייפון זה לוקח 3 לחיצות', 'On iPhone it takes 3 taps') : L('לוקח פחות מדקה', 'Takes less than a minute')}</p>
        </div>
      </div>

      {android && (
        <div className="flex flex-col gap-4">
          <a
            href={APK_URL}
            className="pressable flex h-14 items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--done))] font-display text-[18px] font-semibold text-white shadow-soft"
          >
            <Download size={22} /> {L('הורדת האפליקציה', 'Download the app')}
          </a>
          <ol className="flex flex-col gap-3">
            <Step n={1}>{L('לוחצים על הכפתור הירוק, וההורדה מתחילה.', 'Tap the green button and the download starts.')}</Step>
            <Step n={2}>
              {isEn ? <>When the download finishes, tap <b>"Open"</b> and then <b>"Install"</b>.</> : <>כשההורדה מסתיימת לוחצים <b>"פתיחה"</b> ואז <b>"התקנה"</b>.</>}
            </Step>
            <Step n={3}>
              {isEn ? <>If the phone asks, allow <b>"Allow from this source"</b> or <b>"Install anyway"</b>. This is normal for apps that are not from Google Play.</> : <>אם הטלפון שואל, מאשרים <b>"אפשר ממקור זה"</b> או <b>"התקן בכל זאת"</b>. זה רגיל לאפליקציה שלא מגוגל פליי.</>}
            </Step>
          </ol>
          <p className="rounded-2xl bg-sunken p-3 text-[14px] text-muted">
            {isEn ? <>Bonus: after installing, long-press a message in WhatsApp → Share → <b className="text-ink">Hamesader</b>, and it is saved and sorted.</> : <>בונוס: אחרי ההתקנה, בוואטסאפ לוחצים לחיצה ארוכה על הודעה ← שיתוף ← <b className="text-ink">המסדר</b>, והיא נשמרת ממוינת.</>}
          </p>
        </div>
      )}

      {ios && inApp && (
        <div className="flex flex-col gap-4">
          <p className="rounded-2xl bg-warn-soft p-3 text-[15px] font-semibold text-ink">
            {L('הדף נפתח בתוך וואטסאפ, ומשם אי אפשר להתקין. צריך לפתוח אותו בספארי:', "This page opened inside WhatsApp, which can't install apps. Open it in Safari:")}
          </p>
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              {isEn ? <>Tap <b>⋯</b> or the compass icon 🧭 in the corner and choose <b>"Open in Safari"</b>.</> : <>לוחצים על <b>⋯</b> או על סמל המצפן 🧭 בפינת המסך ובוחרים <b>"פתיחה בספארי"</b>.</>}
            </Step>
            <Step n={2}>{L('בספארי לוחצים שוב על "התקנה".', 'In Safari, tap "Install" again.')}</Step>
          </ol>
          <button onClick={copyLink} className="pressable flex h-12 items-center justify-center gap-2 rounded-2xl border border-line font-semibold">
            <Copy size={17} /> {L('או: העתקת הקישור להדבקה בספארי', 'Or: copy the link to paste in Safari')}
          </button>
        </div>
      )}

      {ios && !inApp && (
        <div className="flex flex-col gap-4">
          <ol className="flex flex-col gap-4">
            <Step n={1}>
              {L('לוחצים על כפתור השיתוף', 'Tap the Share button')}{' '}
              <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-sunken align-middle text-[15px]" aria-hidden>
                ⬆️
              </span>{' '}
              {L('בתחתית המסך.', 'at the bottom of the screen.')}
            </Step>
            <Step n={2}>
              {isEn ? <>Scroll down a little and choose <b>"Add to Home Screen"</b></> : <>גוללים מעט ובוחרים <b>"הוספה למסך הבית"</b></>}{' '}
              <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-sunken align-middle" aria-hidden>
                ➕
              </span>
            </Step>
            <Step n={3}>
              {isEn ? <>Tap <b>"Add"</b> at the top. The Hamesader icon appears on your home screen.</> : <>לוחצים <b>"הוסף"</b> למעלה. האייקון של המסדר יופיע במסך הבית.</>}
            </Step>
          </ol>
          <div className="flex flex-col items-center pt-1 text-brand" aria-hidden>
            <span className="text-[13px] font-semibold">{L('כפתור השיתוף נמצא כאן למטה', 'The Share button is down here')}</span>
            <span className="animate-bounce text-3xl">⬇️</span>
          </div>
        </div>
      )}

      {!ios && !android && (
        <div className="flex flex-col gap-4">
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              {L('בשורת הכתובת של Chrome או Edge לוחצים על סמל ההתקנה', 'In the Chrome or Edge address bar, click the install icon')} <Smartphone size={16} className="inline" /> {L('(בצד ימין של הכתובת).', '(at the right end of the address).')}
            </Step>
            <Step n={2}>
              {isEn ? <>Confirm <b>"Install"</b>, and Hamesader opens as its own app.</> : <>מאשרים <b>"התקנה"</b>, והמסדר נפתח כאפליקציה נפרדת.</>}
            </Step>
          </ol>
          <p className="text-[14px] text-muted">{L('בטלפון אנדרואיד אפשר להוריד את האפליקציה ישירות מהכפתור באותו מסך.', 'On an Android phone you can download the app directly from the same button.')}</p>
        </div>
      )}

      <button onClick={onClose} className="mt-5 h-11 w-full rounded-xl font-semibold text-muted hover:bg-sunken">
        {L('סגירה', 'Close')}
      </button>
    </Sheet>
  );
}

/** Shown in the profile when the app already runs installed, so it is clear why there is no install button. */
export function InstalledBadge() {
  const native = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
  if (!native && !isStandalone()) return null;
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-[rgb(var(--done))]/30 bg-done-soft p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--done))] text-xl text-white" aria-hidden>
        ✓
      </span>
      <div>
        <div className="font-display text-[16px] font-semibold">{L('המסדר מותקן בטלפון', 'Hamesader is installed on this phone')}</div>
        <p className="text-[14px] text-muted">{native ? L('זו אפליקציית האנדרואיד.', 'This is the Android app.') : L('נפתח מהאייקון במסך הבית.', 'Opened from the home screen icon.')} {L('לכן לא מופיע כפתור התקנה.', "That's why there is no install button.")}</p>
      </div>
    </div>
  );
}
