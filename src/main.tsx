import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { initPwa } from './lib/pwa';
import { initAnalytics } from './lib/analytics';
import { initLiveUpdate } from './lib/liveUpdate';

initPwa();
initAnalytics();
initLiveUpdate();

document.documentElement.lang = 'he';
document.documentElement.dir = 'rtl';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
