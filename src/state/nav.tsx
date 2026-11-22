import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CategoryId, ContentType } from '../lib/types';

export type Tab = 'home' | 'search' | 'categories' | 'profile';

export type Route =
  | { name: 'home' }
  | { name: 'search'; q?: string }
  | { name: 'categories' }
  | { name: 'profile' }
  | { name: 'category'; id: CategoryId }
  | { name: 'item'; id: string }
  | { name: 'inbox' }
  | { name: 'favorites' }
  | { name: 'tag'; tag: string };

interface Nav {
  route: Route;
  tab: Tab;
  canGoBack: boolean;
  go(r: Route): void;
  back(): void;
  switchTab(t: Tab): void;
  composer: { open: boolean; hint?: ContentType; initialText?: string; initialImage?: string };
  openComposer(hint?: ContentType, initialText?: string, initialImage?: string): void;
  closeComposer(): void;
  /** Category that just received a new item - used for the "found its home" pulse */
  justFiled: CategoryId | null;
  markFiled(c: CategoryId): void;
}

const TABS: Tab[] = ['home', 'search', 'categories', 'profile'];
const tabFromHash = (): Tab => {
  const h = (typeof location !== 'undefined' ? location.hash.slice(1) : '') as Tab;
  return TABS.includes(h) ? h : 'home';
};

const Ctx = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>(() => [{ name: tabFromHash() } as Route]);
  const [composer, setComposer] = useState<Nav['composer']>({ open: false });
  const [justFiled, setJustFiled] = useState<CategoryId | null>(null);
  const route = stack[stack.length - 1];
  const tab = (stack[0].name as Tab) ?? 'home';

  useEffect(() => {
    const onHash = () => setStack([{ name: tabFromHash() } as Route]);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const scrollTop = () => requestAnimationFrame(() => document.getElementById('main-scroll')?.scrollTo({ top: 0 }));

  const go = useCallback((r: Route) => {
    if (TABS.includes(r.name as Tab) && r.name !== 'search') {
      setStack([r]);
    } else setStack((s) => [...s, r]);
    scrollTop();
  }, []);

  const back = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    scrollTop();
  }, []);

  const switchTab = useCallback((t: Tab) => {
    setStack([{ name: t } as Route]);
    try {
      if (location.hash.slice(1) !== t) history.replaceState(null, '', t === 'home' ? location.pathname + location.search : '#' + t);
    } catch {
      /* sandboxed frames may refuse history changes */
    }
    scrollTop();
  }, []);

  const markFiled = useCallback((c: CategoryId) => {
    setJustFiled(c);
    window.setTimeout(() => setJustFiled(null), 1600);
  }, []);

  return (
    <Ctx.Provider
      value={{
        route,
        tab,
        canGoBack: stack.length > 1,
        go,
        back,
        switchTab,
        composer,
        openComposer: (hint, initialText, initialImage) => setComposer({ open: true, hint, initialText, initialImage }),
        closeComposer: () => setComposer((c) => ({ ...c, open: false })),
        justFiled,
        markFiled,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useNav() {
  const n = useContext(Ctx);
  if (!n) throw new Error('useNav outside provider');
  return n;
}
