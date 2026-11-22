import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../state/store';
import { TagChip } from './ui';
import { L } from '../lib/i18n';

export function TagEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const { allTags, settings, updateSettings } = useStore();
  const [draft, setDraft] = useState('');
  const suggestions = allTags.filter((t) => !tags.includes(t) && (!draft || t.includes(draft.replace(/^#/, '')))).slice(0, 8);

  const add = (raw: string) => {
    const t = raw.replace(/^#/, '').trim();
    if (!t || tags.includes(t)) return setDraft('');
    onChange([...tags, t]);
    if (!allTags.includes(t)) updateSettings({ customTags: [...settings.customTags, t] });
    setDraft('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <TagChip key={t} tag={t} selected onRemove={() => onChange(tags.filter((x) => x !== t))} />
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add(draft);
          }}
          className="inline-flex h-7 items-center rounded-full border border-dashed border-line ps-2.5"
        >
          <input
            id="tag-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={L('תגית חדשה', 'New tag')}
            className="w-24 bg-transparent text-[13px] outline-none placeholder:text-faint"
            aria-label={L('הוספת תגית', 'Add a tag')}
          />
          <button type="submit" className="grid h-7 w-7 place-items-center text-muted" aria-label={L('הוסף תגית', 'Add tag')}>
            <Plus size={14} />
          </button>
        </form>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-faint">{L('הצעות:', 'Suggestions:')}</span>
          {suggestions.map((t) => (
            <button key={t} onClick={() => add(t)} className="rounded-full bg-sunken px-2.5 py-1 text-[12px] font-semibold text-muted hover:text-ink">
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
