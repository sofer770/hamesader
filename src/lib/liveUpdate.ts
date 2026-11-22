/**
 * Android app: update itself from the website, without reinstalling the APK.
 * The site publishes app/version.php ({"version": "..."}) and app/bundle.zip (the same app, built for the phone).
 * When the site has a newer version, the app downloads it in the background and switches to it the next time
 * it is opened or returns from the background. Saved items stay (same storage).
 */
declare const __BUILD_ID__: string;

const SITE = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '');
const isNativeApp = () => !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

export async function initLiveUpdate() {
  if (!isNativeApp() || !SITE) return;
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    // Tell the updater this version started fine (otherwise it rolls back to the previous one)
    await CapacitorUpdater.notifyAppReady();

    const res = await fetch(`${SITE}/app/version.php?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const { version } = (await res.json()) as { version?: string };
    if (!version || version === __BUILD_ID__) return;

    // Already downloaded earlier? Then just schedule it.
    const { bundles } = await CapacitorUpdater.list();
    const ready = bundles.find((b) => b.version === version && b.status === 'success');
    const bundle = ready ?? (await CapacitorUpdater.download({ url: `${SITE}/app/bundle.zip?v=${version}`, version }));
    // Applied when the app goes to the background and comes back, so nothing jumps while the person is using it
    await CapacitorUpdater.next({ id: bundle.id });
  } catch {
    /* no internet or plugin missing - try again next launch */
  }
}
