import { useState } from 'react';
import { useStore } from '../state/store';
import { Logo } from './ui';
import { L } from '../lib/i18n';

/** First launch: ask how to greet the person. Shown once; the name can be changed later in the profile. */
export function Welcome() {
  const { settings, updateSettings, showToast } = useStore();
  const [name, setName] = useState('');
  if (settings.nameAsked) return null;
  const embedded = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  if (embedded) return null;

  const done = (n: string) => {
    updateSettings({ name: n, nameAsked: true });
    if (n) showToast({ text: L(`נעים להכיר, ${n}`, `Nice to meet you, ${n}`), emoji: '👋' });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-labelledby="welcome-title">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          done(name.trim());
        }}
        className="w-full max-w-sm animate-pop-in rounded-[28px] bg-surface p-6 text-center shadow-lift"
      >
        <Logo size={72} className="mx-auto shadow-soft" />
        <h2 id="welcome-title" className="mt-3 font-display text-[22px] font-bold">
          {L('ברוכים הבאים למסדר', 'Welcome to Hamesader')}
        </h2>
        <p className="mt-1 text-[15px] text-muted">{L('איך לקרוא לך?', 'What should we call you?')}</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={L('השם שלך', 'Your name')}
          maxLength={30}
          aria-label={L('השם שלך', 'Your name')}
          className="mt-4 h-12 w-full rounded-2xl border border-line bg-bg px-4 text-center text-[17px] outline-none focus:border-brand/60"
        />
        <button type="submit" disabled={!name.trim()} className="pressable mt-3 h-12 w-full rounded-2xl bg-brand font-display text-[17px] font-semibold text-brand-ink shadow-fab disabled:opacity-50">
          {L('בואו נתחיל', "Let's start")}
        </button>
        <button type="button" onClick={() => done('')} className="mt-3 text-[14px] font-semibold text-muted hover:text-ink">
          {L('דילוג', 'Skip')}
        </button>
      </form>
    </div>
  );
}
