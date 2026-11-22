import { ExternalLink } from 'lucide-react';
import type { LinkPreview } from '../lib/types';

const COVER_EMOJI: Record<string, string> = { food: '🍝', map: '📍', news: '📰', video: '▶️', shop: '🛍️', social: '💬', web: '🌐' };

export function LinkCover({ cover = 'web', className = '' }: { cover?: string; className?: string }) {
  return (
    <div className={`cover cover-${cover} grid place-items-center ${className}`}>
      <span className="relative z-10 text-3xl drop-shadow-sm" aria-hidden>
        {COVER_EMOJI[cover] ?? '🌐'}
      </span>
    </div>
  );
}

export function LinkCard({ link }: { link: LinkPreview }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="pressable group block overflow-hidden rounded-3xl border border-line bg-surface shadow-soft hover:shadow-lift"
    >
      <LinkCover cover={link.cover} className="h-36" />
      <div className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-sunken text-[11px] font-bold uppercase text-ink">{link.siteName.slice(0, 1)}</span>
          <span className="truncate">{link.siteName}</span>
          <span className="ltr truncate text-faint">{link.domain}</span>
        </div>
        <h3 className="font-display text-[17px] font-semibold leading-snug">{link.title}</h3>
        {link.description && <p className="line-clamp-2 text-[15px] text-muted">{link.description}</p>}
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand">
          פתיחת הקישור <ExternalLink size={14} />
        </span>
      </div>
    </a>
  );
}
