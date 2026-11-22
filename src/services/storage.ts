import type { Item } from '../lib/types';

/**
 * Persistence boundary. The MVP keeps data on the device (localStorage).
 * A Supabase implementation only needs to satisfy this interface (load/save per user).
 */
export interface ItemsRepository {
  load(): Item[] | null;
  save(items: Item[]): void;
  clear(): void;
}

export interface Settings {
  name: string;
  theme: 'system' | 'light' | 'dark';
  seeded: boolean;
  recentSearches: string[];
  customTags: string[];
  reminderSound: 'bell' | 'beep' | 'chime' | 'none';
  /** true once the user was asked for their name (welcome screen) */
  nameAsked: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  theme: 'system',
  seeded: false,
  recentSearches: [],
  customTags: [],
  reminderSound: 'bell',
  nameAsked: false,
};

const KEY_ITEMS = 'hamesader.items.v1';
const KEY_SETTINGS = 'hamesader.settings.v1';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked - the app keeps working in memory */
  }
}

export const localRepository: ItemsRepository = {
  load: () => read<Item[]>(KEY_ITEMS),
  save: (items) => write(KEY_ITEMS, items),
  clear: () => {
    try {
      localStorage.removeItem(KEY_ITEMS);
    } catch {
      /* ignore */
    }
  },
};

export const settingsStore = {
  load: (): Settings => {
    const s = { ...DEFAULT_SETTINGS, ...(read<Partial<Settings>>(KEY_SETTINGS) ?? {}) };
    // Older versions greeted everyone as "יאיר" - clear that default so each person is asked for their own name
    if (!s.nameAsked && s.name === 'יאיר') s.name = '';
    return s;
  },
  save: (s: Settings) => write(KEY_SETTINGS, s),
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
