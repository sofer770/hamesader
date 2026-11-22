import type { Item } from './types';
import { isEn, L } from './i18n';

/**
 * Reminders: the sound + vibration + notification side.
 * - In the browser / installed web app: a timer inside the app plays a beep and shows an alert (only while the app is open).
 * - In the Android app: reminders are also handed to the phone's alarm system, so they ring even when the app is closed.
 */

export type ReminderSound = 'bell' | 'beep' | 'chime' | 'none';

export const REMINDER_SOUNDS: { value: ReminderSound; label: string; emoji: string }[] = [
  { value: 'bell', label: L('פעמון', 'Bell'), emoji: '🔔' },
  { value: 'beep', label: L('צפצוף', 'Beep'), emoji: '📟' },
  { value: 'chime', label: L('עדין', 'Gentle'), emoji: '🎐' },
  { value: 'none', label: L('שקט', 'Silent'), emoji: '🔕' },
];

export const isNative = () => !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

export const reminderOf = (i: Item) => i.reminderAt ?? i.task?.reminderAt;
export const isReminderPending = (i: Item) => !!i.reminderAt && !i.reminderFired && !(i.task?.done);

/* ---------------- sound ---------------- */

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** Browsers only allow sound after the user touched the page once - call this on any tap. */
export function unlockAudio() {
  audio();
}

function tone(ac: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, vol: number) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(ac.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
}

/** One "ring" of the chosen sound. Returns its length in seconds. */
function ringOnce(kind: ReminderSound, at: number, ac: AudioContext): number {
  switch (kind) {
    case 'beep':
      for (let k = 0; k < 3; k++) tone(ac, 1760, at + k * 0.22, 0.14, 'square', 0.12);
      return 0.9;
    case 'chime':
      tone(ac, 784, at, 0.9, 'sine', 0.25);
      tone(ac, 1175, at + 0.25, 1.1, 'sine', 0.2);
      return 1.6;
    case 'bell':
    default:
      [880, 1320, 1760].forEach((f, k) => tone(ac, f, at, 1.2 - k * 0.25, 'triangle', 0.3 / (k + 1)));
      [880, 1320, 1760].forEach((f, k) => tone(ac, f, at + 0.45, 1.2 - k * 0.25, 'triangle', 0.3 / (k + 1)));
      return 1.4;
  }
}

/** Plays the reminder sound `times` times. */
export function playReminderSound(kind: ReminderSound, times = 3) {
  if (kind === 'none') return;
  const ac = audio();
  if (!ac) return;
  let t = ac.currentTime + 0.05;
  for (let n = 0; n < times; n++) t += ringOnce(kind, t, ac) + 0.35;
}

export function vibrate() {
  try {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
  } catch {
    /* ignore */
  }
}

/* ---------------- notifications ---------------- */

export async function askNotificationPermission() {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.requestPermissions();
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
  } catch {
    /* ignore */
  }
}

/** System notification while the web app is open / in the background (the native app schedules its own). */
export async function showWebNotification(title: string) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body: title, icon: import.meta.env.BASE_URL + 'icons/icon-192.png', tag: 'hamesader-reminder', renotify: true, vibrate: [300, 150, 300] } as NotificationOptions;
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(L('⏰ תזכורת מהמסדר', '⏰ Reminder from Hamesader'), opts);
    else new Notification(L('⏰ תזכורת מהמסדר', '⏰ Reminder from Hamesader'), opts);
  } catch {
    /* ignore */
  }
}

/** Stable numeric id for the Android alarm, derived from the item id. */
function numericId(id: string) {
  let h = 0;
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) | 0;
  return Math.abs(h) % 2_000_000_000 || 1;
}

let channelReady = false;
/** Android app: make the phone's alarm system match the reminders in the app. */
export async function syncNativeReminders(items: Item[]) {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    if (!channelReady) {
      await LocalNotifications.createChannel({
        id: 'reminders',
        name: L('תזכורות', 'Reminders'),
        description: L('תזכורות שהגדרת במסדר', 'Reminders you set in Hamesader'),
        importance: 5,
        visibility: 1,
        sound: 'reminder.wav',
        vibration: true,
      });
      channelReady = true;
    }
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    const now = Date.now();
    const upcoming = items.filter((i) => isReminderPending(i) && new Date(i.reminderAt!).getTime() > now);
    if (!upcoming.length) return;
    await LocalNotifications.schedule({
      notifications: upcoming.map((i) => ({
        id: numericId(i.id),
        title: L('⏰ תזכורת מהמסדר', '⏰ Reminder from Hamesader'),
        body: i.title,
        channelId: 'reminders',
        sound: 'reminder.wav',
        smallIcon: 'ic_stat_notify',
        iconColor: '#3B2E8A',
        schedule: { at: new Date(i.reminderAt!), allowWhileIdle: true },
        extra: { itemId: i.id },
      })),
    });
  } catch {
    /* plugin unavailable */
  }
}

/** Android app: tapping the notification opens the item. */
export async function onNativeReminderTap(open: (itemId: string) => void) {
  if (!isNative()) return () => {};
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const h = await LocalNotifications.addListener('localNotificationActionPerformed', (e) => {
      const id = (e.notification.extra as { itemId?: string } | undefined)?.itemId;
      if (id) open(id);
    });
    return () => h.remove();
  } catch {
    return () => {};
  }
}

/* ---------------- quick picks ---------------- */

export interface ReminderPreset {
  id: string;
  label: string;
  at: (now: Date) => Date;
}

const atTime = (base: Date, h: number, m = 0, addDays = 0) => {
  const d = new Date(base);
  d.setDate(d.getDate() + addDays);
  d.setHours(h, m, 0, 0);
  return d;
};

export const REMINDER_PRESETS: ReminderPreset[] = [
  { id: '10m', label: L('בעוד 10 דקות', 'In 10 minutes'), at: (n) => new Date(n.getTime() + 10 * 60_000) },
  { id: '1h', label: L('בעוד שעה', 'In 1 hour'), at: (n) => new Date(n.getTime() + 60 * 60_000) },
  { id: '3h', label: L('בעוד 3 שעות', 'In 3 hours'), at: (n) => new Date(n.getTime() + 180 * 60_000) },
  { id: 'eve', label: L('הערב ב-20:00', 'This evening at 20:00'), at: (n) => (n.getHours() >= 20 ? atTime(n, 20, 0, 1) : atTime(n, 20)) },
  { id: 'tmr', label: L('מחר ב-08:00', 'Tomorrow at 08:00'), at: (n) => atTime(n, 8, 0, 1) },
  { id: 'wk', label: L('בעוד שבוע', 'In a week'), at: (n) => atTime(n, 9, 0, 7) },
];

export function formatReminder(iso: string, now = new Date()) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const day0 = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day0(d) - day0(now)) / 86_400_000);
  if (isEn) {
    if (diff === 0) return `today at ${time}`;
    if (diff === 1) return `tomorrow at ${time}`;
    if (diff === -1) return `yesterday at ${time}`;
    if (diff > 1 && diff < 7) return `${d.toLocaleDateString('en-US', { weekday: 'long' })} at ${time}`;
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`;
  }
  if (diff === 0) return `היום ב-${time}`;
  if (diff === 1) return `מחר ב-${time}`;
  if (diff === -1) return `אתמול ב-${time}`;
  if (diff > 1 && diff < 7) return `${d.toLocaleDateString('he-IL', { weekday: 'long' })} ב-${time}`;
  return `${d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })} ב-${time}`;
}
