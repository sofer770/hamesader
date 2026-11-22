/** Installable-app support: offline service worker + the browser's "install" prompt. */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function isStandalone(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Inside a native wrapper (Capacitor) or an embedded preview we skip the web-install flow. */
const isEmbedded = () => {
  try {
    return window.self !== window.top || !!(window as unknown as { Capacitor?: unknown }).Capacitor;
  } catch {
    return true;
  }
};

export function initPwa() {
  if (isEmbedded()) return;
  try {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      window.addEventListener('load', () => navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {}));
    }
  } catch {
    /* ignore */
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

export const canPromptInstall = () => !!deferred;
export const canShowInstallHelp = () => !isEmbedded() && !isStandalone();

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  notify();
  return outcome === 'accepted';
}

export function onInstallChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
