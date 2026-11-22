import { Check } from 'lucide-react';
import type { CategoryId } from '../lib/types';
import { CATEGORIES, toneBg } from '../lib/categories';
import { Sheet } from './ui';

export function CategoryPicker({ open, current, onPick, onClose }: { open: boolean; current: CategoryId; onPick: (c: CategoryId) => void; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="לאן זה שייך?">
      <ul className="grid grid-cols-1 gap-2 pb-2 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onPick(c.id)}
              className={`pressable flex h-14 w-full items-center gap-3 rounded-2xl border px-3 text-start ${current === c.id ? 'border-brand bg-brand-soft' : 'border-line hover:bg-sunken'}`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl text-lg" style={toneBg(c.id)} aria-hidden>
                {c.emoji}
              </span>
              <span className="flex-1 font-semibold">{c.name}</span>
              {current === c.id && <Check size={18} className="text-brand" />}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
