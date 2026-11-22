import { useState } from 'react';
import { Check, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import type { Item } from '../lib/types';
import { useStore } from '../state/store';
import { uid } from '../services/storage';

export function Checklist({ item, compact = false }: { item: Item; compact?: boolean }) {
  const { toggleCheck, update, showToast } = useStore();
  const [draft, setDraft] = useState('');
  const list = item.checklist ?? [];
  const done = list.filter((c) => c.checked).length;
  // unchecked first, like a real shopping trip
  const ordered = [...list.filter((c) => !c.checked), ...list.filter((c) => c.checked)];

  const add = () => {
    const parts = draft.split(/,|\n/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    update(item.id, (i) => ({ checklist: [...(i.checklist ?? []), ...parts.map((text) => ({ id: uid(), text, checked: false }))] }));
    setDraft('');
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[13px] text-muted">
        <span className="tabular font-semibold">
          {list.length ? (done === list.length ? '🎉 הכל נקנה!' : `${done} מתוך ${list.length} נקנו`) : 'הרשימה ריקה'}
        </span>
        {done > 0 && (
          <span className="flex gap-1">
            <button
              onClick={() => {
                update(item.id, (i) => ({ checklist: i.checklist?.map((c) => ({ ...c, checked: false })) }));
                showToast({ text: 'הסימונים אופסו. רשימה מוכנה לקנייה הבאה', emoji: '🔄' });
              }}
              className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 font-semibold hover:bg-sunken"
            >
              <RotateCcw size={13} /> איפוס סימונים
            </button>
            {!compact && (
              <button
                onClick={() => update(item.id, (i) => ({ checklist: i.checklist?.filter((c) => !c.checked) }))}
                className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 font-semibold hover:bg-sunken"
              >
                <Trash2 size={13} /> הסרת מה שנקנה
              </button>
            )}
          </span>
        )}
      </div>
      <ul className="flex flex-col">
        {ordered.map((c) => (
          <li key={c.id} className="group flex items-center gap-3 border-b border-line/60 py-1 last:border-0">
            <button
              onClick={() => toggleCheck(item.id, c.id)}
              aria-pressed={c.checked}
              className="flex min-h-[44px] flex-1 items-center gap-3 text-start"
            >
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-colors ${c.checked ? 'border-done bg-done text-white' : 'border-faint/70'}`}>
                {c.checked && <Check size={15} strokeWidth={3} />}
              </span>
              <span className={`text-[16px] ${c.checked ? 'text-faint line-through' : ''}`}>{c.text}</span>
            </button>
            <button
              onClick={() => update(item.id, (i) => ({ checklist: i.checklist?.filter((x) => x.id !== c.id) }))}
              className="grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-sunken hover:text-danger lg:opacity-0 lg:group-hover:opacity-100"
              aria-label={`הסרת ${c.text}`}
            >
              <X size={15} />
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="mt-2 flex items-center gap-2"
      >
        <input
          id={`add-product-${item.id}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="הוספת מוצר (אפשר כמה, עם פסיקים)"
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 text-[15px] outline-none focus:border-brand/60"
        />
        <button type="submit" disabled={!draft.trim()} className="pressable grid h-11 w-11 place-items-center rounded-xl bg-brand text-brand-ink disabled:opacity-40" aria-label="הוספה">
          <Plus size={20} />
        </button>
      </form>
    </div>
  );
}
