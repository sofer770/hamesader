import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { canPromptInstall, canShowInstallHelp, isIOS, onInstallChange, promptInstall } from '../lib/pwa';
import { useStore } from '../state/store';
import { Logo } from './ui';

const KEY = 'hamesader.installDismissed';

/** "Install the app" card: one-tap install where the browser allows it, short instructions on iPhone. */
export function InstallCard({ dismissible = false }: { dismissible?: boolean }) {
  const { showToast } = useStore();
  const [, force] = useState(0);
  const [hidden, setHidden] = useState(() => {
    try {
      return dismissible && localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);

  if (hidden || !canShowInstallHelp()) return null;
  const oneTap = canPromptInstall();
  const ios = isIOS();

  return (
    <div className="relative flex items-start gap-3 rounded-3xl border border-line bg-surface p-4 shadow-soft">
      <Logo size={48} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-[16px] font-semibold">התקינו את המסדר בטלפון</div>
        {oneTap || !ios ? (
          <p className="text-[14px] text-muted">אייקון במסך הבית, נפתח במסך מלא, עובד גם בלי אינטרנט, ומופיע בתפריט השיתוף של וואטסאפ.</p>
        ) : (
          <p className="text-[14px] text-muted">
            בספארי: לוחצים על כפתור השיתוף <span aria-hidden>⬆️</span> ואז "הוספה למסך הבית".
          </p>
        )}
        {(oneTap || !ios) && (
          <button
            onClick={async () => {
              if (oneTap) {
                if (await promptInstall()) showToast({ text: 'המסדר הותקן. אפשר לפתוח מהאייקון', emoji: '📲' });
              } else showToast({ text: 'בתפריט הדפדפן (⋮) בוחרים "התקנת אפליקציה"', emoji: '📲' });
            }}
            className="pressable mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-brand-ink"
          >
            <Download size={16} /> התקנה
          </button>
        )}
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
          }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint hover:bg-sunken"
          aria-label="סגירה"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
