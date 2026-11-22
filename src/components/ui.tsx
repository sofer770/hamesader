import { useEffect, type ReactNode } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { CategoryId } from '../lib/types';
import { CATEGORY_BY_ID, toneBg, toneInk } from '../lib/categories';
import { useNav } from '../state/nav';
import logoUrl from '../assets/logo.webp';

export function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  return <img src={logoUrl} width={size} height={size} alt="המסדר" className={`rounded-xl ${className}`} style={{ width: size, height: size }} />;
}

export function Footer() {
  return (
    <footer className="mt-14 mb-4 flex flex-col items-center gap-1 text-center text-[13px] leading-relaxed text-faint">
      <div className="mb-2 h-px w-16 bg-line" />
      <p>נוצר ע"י יאיר גלעדי</p>
      <p>המרכז לבריאות טבעית ©</p>
      <p className="tabular">
        <a
          href="https://wa.me/972542135831"
          target="_blank"
          rel="noopener noreferrer"
          className="ltr font-semibold text-[rgb(var(--done))] underline decoration-line underline-offset-4"
          title="שליחת הודעה בוואטסאפ"
        >
          054-2135831
        </a>
        {' - '}
        <a href="https://el-habriut.co.il" target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-4 hover:text-brand">
          https://el-habriut.co.il
        </a>
      </p>
    </footer>
  );
}

export function ScreenHeader({ title, subtitle, actions, emoji }: { title: string; subtitle?: string; actions?: ReactNode; emoji?: string }) {
  const nav = useNav();
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-2 flex items-center gap-2 bg-bg/90 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-md lg:-mx-8 lg:px-8">
      {nav.canGoBack && (
        <button onClick={nav.back} className="pressable -ms-1 grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-sunken" aria-label="חזרה">
          <ArrowRight size={22} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-2 truncate font-display text-[22px] font-semibold leading-tight">
          {emoji && <span aria-hidden>{emoji}</span>}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}

export function IconButton({ label, onClick, children, active, className = '' }: { label: string; onClick: () => void; children: ReactNode; active?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`pressable grid h-10 w-10 place-items-center rounded-full ${active ? 'text-warn' : 'text-ink'} hover:bg-sunken ${className}`}
    >
      {children}
    </button>
  );
}

export function CategoryBadge({ id, size = 'sm', onClick }: { id: CategoryId; size?: 'sm' | 'md'; onClick?: () => void }) {
  const c = CATEGORY_BY_ID[id];
  const cls = size === 'sm' ? 'h-6 px-2 text-[12px] gap-1' : 'h-8 px-3 text-sm gap-1.5';
  const Comp = onClick ? 'button' : 'span';
  return (
    <Comp onClick={onClick} className={`inline-flex shrink-0 items-center rounded-full font-semibold ${cls} ${onClick ? 'pressable' : ''}`} style={{ ...toneBg(id), ...toneInk(id) }}>
      <span aria-hidden>{c.emoji}</span>
      {c.name}
    </Comp>
  );
}

export function TagChip({ tag, onClick, onRemove, selected }: { tag: string; onClick?: () => void; onRemove?: () => void; selected?: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[13px] font-medium ${
        selected ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface text-muted'
      }`}
    >
      <button onClick={onClick} disabled={!onClick} className="disabled:cursor-default">
        #{tag}
      </button>
      {onRemove && (
        <button onClick={onRemove} aria-label={`הסר תגית ${tag}`} className="-me-1 grid h-5 w-5 place-items-center rounded-full hover:bg-sunken">
          <X size={12} />
        </button>
      )}
    </span>
  );
}

export function Sheet({ open, onClose, children, title, labelledBy }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; labelledBy?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title} aria-labelledby={labelledBy}>
      <div className="absolute inset-0 animate-fade-in bg-[rgb(20_16_40/0.38)] backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[92%] w-full max-w-lg animate-sheet-up overflow-y-auto rounded-t-4xl bg-surface px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 shadow-lift sm:rounded-4xl sm:pt-5">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        {title && <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length || !text) return <>{text}</>;
  const esc = terms.filter((t) => t.length >= 2).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!esc.length) return <>{text}</>;
  // Allow Hebrew final letters to match their normalized form
  const pattern = esc.map((t) => t.replace(/כ|מ|נ|פ|צ/g, (c) => `[${c}${{ כ: 'ך', מ: 'ם', נ: 'ן', פ: 'ף', צ: 'ץ' }[c]}]`)).join('|');
  const parts = text.split(new RegExp(`(${pattern})`, 'gi'));
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <mark key={i} className="hl">{p}</mark> : <span key={i}>{p}</span>))}
    </>
  );
}

export function EmptyState({ emoji, title, text, action }: { emoji: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-10 text-center">
      <div className="mb-3 text-4xl" aria-hidden>
        {emoji}
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-xs text-[15px] text-muted">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: { value: T; options: { value: T; label: ReactNode; count?: number }[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl bg-sunken p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`pressable flex shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-semibold ${size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-3 text-sm'} ${
            value === o.value ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
          {o.count !== undefined && <span className={`tabular text-[12px] ${value === o.value ? 'text-brand' : 'text-faint'}`}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-center justify-between gap-3">
      <h2 className="font-display text-[17px] font-semibold">{children}</h2>
      {action}
    </div>
  );
}

export function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="text-sm font-semibold text-brand hover:underline">
      {children}
    </button>
  );
}
