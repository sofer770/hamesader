/** @type {import('tailwindcss').Config} */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        sunken: v('sunken'),
        ink: v('ink'),
        muted: v('muted'),
        faint: v('faint'),
        line: v('line'),
        brand: v('brand'),
        'brand-soft': v('brand-soft'),
        'brand-ink': v('brand-ink'),
        hero: v('hero'),
        'hero-ink': v('hero-ink'),
        done: v('done'),
        'done-soft': v('done-soft'),
        warn: v('warn'),
        'warn-soft': v('warn-soft'),
        danger: v('danger'),
        'danger-soft': v('danger-soft'),
      },
      fontFamily: {
        sans: ['Assistant', 'Arial Hebrew', 'Segoe UI', 'Arial', 'sans-serif'],
        display: ['Rubik', 'Assistant', 'Arial Hebrew', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--shadow) / 0.05), 0 4px 16px -4px rgb(var(--shadow) / 0.08)',
        lift: '0 2px 4px rgb(var(--shadow) / 0.06), 0 12px 32px -8px rgb(var(--shadow) / 0.18)',
        fab: '0 8px 24px -6px rgb(var(--brand) / 0.55)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(8px) scale(.98)' }, to: { opacity: '1', transform: 'none' } },
        'home-found': { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.06)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'sheet-up': 'sheet-up .28s cubic-bezier(.2,.8,.2,1)',
        'fade-in': 'fade-in .2s ease-out',
        'pop-in': 'pop-in .25s cubic-bezier(.2,.8,.2,1) both',
        'home-found': 'home-found .5s ease-out',
      },
    },
  },
  plugins: [],
};
