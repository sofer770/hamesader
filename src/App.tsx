import { useEffect } from 'react';
import { StoreProvider, useStore } from './state/store';
import { NavProvider, useNav } from './state/nav';
import { AppShell } from './components/AppShell';
import { HomeScreen } from './screens/Home';
import { SearchScreen } from './screens/Search';
import { CategoriesScreen, CategoryScreen } from './screens/Categories';
import { ItemDetailScreen } from './screens/ItemDetail';
import { FavoritesScreen, InboxScreen, TagScreen } from './screens/Lists';
import { ProfileScreen } from './screens/Profile';

function Router() {
  const { route } = useNav();
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'search':
      return <SearchScreen initial={route.q} />;
    case 'categories':
      return <CategoriesScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'category':
      return <CategoryScreen key={route.id} id={route.id} />;
    case 'item':
      return <ItemDetailScreen key={route.id} id={route.id} />;
    case 'inbox':
      return <InboxScreen />;
    case 'favorites':
      return <FavoritesScreen />;
    case 'tag':
      return <TagScreen key={route.tag} tag={route.tag} />;
  }
}

function ThemeSync() {
  const { settings } = useStore();
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);
  return null;
}

export default function App() {
  return (
    <StoreProvider>
      <NavProvider>
        <ThemeSync />
        <AppShell>
          <Router />
        </AppShell>
      </NavProvider>
    </StoreProvider>
  );
}
