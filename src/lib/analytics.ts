/**
 * Anonymous usage counter for the admin page (admin.php on the site).
 * Sends: one "visit" per device per day, one "install" per device, and one "open" per day from the installed app.
 * Only a random device id is sent - no names, phone numbers or saved content.
 */
const SITE = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '');
const KEY = 'hamesader.stats.v1';

type Mode = 'web' | 'pwa' | 'android';

const isNativeApp = () => !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

function mode(): Mode {
  if (isNativeApp()) return 'android';
  try {
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone) return 'pwa';
  } catch {
    /* ignore */
  }
  return 'web';
}

function state(): { id: string; visit?: string; open?: string; installed?: boolean } {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (s?.id) return s;
  } catch {
    /* ignore */
  }
  const id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
  return { id };
}
function save(s: ReturnType<typeof state>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function endpoint(): string | null {
  if (isNativeApp()) return SITE ? `${SITE}/api/track.php` : null;
  // Count only on the real site, not in previews, local testing or the GitHub backup
  if (location.hostname !== 'el-habriut.co.il' && location.hostname !== 'www.el-habriut.co.il') return null;
  try {
    if (window.self !== window.top) return null;
  } catch {
    return null;
  }
  return `${location.origin}${import.meta.env.BASE_URL}api/track.php`;
}

function send(e: 'visit' | 'install' | 'open', m: Mode, id: string) {
  const url = endpoint();
  if (!url) return;
  const body = JSON.stringify({ e, m, id });
  try {
    // text/plain keeps it a "simple" request (no CORS preflight from the Android app)
    if (navigator.sendBeacon?.(url, new Blob([body], { type: 'text/plain' }))) return;
  } catch {
    /* fall through */
  }
  fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, keepalive: true, mode: 'no-cors' }).catch(() => {});
}

export function initAnalytics() {
  if (!endpoint()) return;
  const today = new Date().toLocaleDateString('en-CA');
  const s = state();
  const m = mode();
  if (s.visit !== today) {
    send('visit', m, s.id);
    s.visit = today;
  }
  if (m !== 'web') {
    if (!s.installed) {
      send('install', m, s.id);
      s.installed = true;
    }
    if (s.open !== today) {
      send('open', m, s.id);
      s.open = today;
    }
  }
  save(s);
  // Installed from the browser's install prompt (counted right away, before the first launch)
  window.addEventListener('appinstalled', () => {
    const st = state();
    if (st.installed) return;
    send('install', 'pwa', st.id);
    st.installed = true;
    save(st);
  });
}
