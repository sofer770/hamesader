import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { APP_NAME, dir, lang } from './lib/i18n';
import { initPwa } from './lib/pwa';
import { initAnalytics } from './lib/analytics';
import { initLiveUpdate } from './lib/liveUpdate';

initPwa();
initAnalytics();
initLiveUpdate();

document.documentElement.lang = lang;
document.documentElement.dir = dir;
document.title = APP_NAME;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
