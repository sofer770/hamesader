import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ClipboardPaste, ImagePlus, Sparkles, X } from 'lucide-react';
import type { CategoryId, ClassificationResult, ContentType } from '../lib/types';
import { CATEGORIES, CATEGORY_BY_ID, toneBg, toneInk } from '../lib/categories';
import { classifier } from '../services/classifier';
import { formatDue } from '../lib/dates';
import { fileToDataUrl } from '../lib/image';
import { useStore } from '../state/store';
import { useNav } from '../state/nav';
import { Sheet } from './ui';
import { L } from '../lib/i18n';

const TYPES: { value: ContentType; label: string; emoji: string; placeholder: string }[] = [
  { value: 'text', label: L('טקסט', 'Text'), emoji: '✍️', placeholder: L('מה רוצים לשמור? קישור, רשימה, מחשבה, הכל הולך', 'What do you want to save? A link, a list, a thought, anything goes') },
  { value: 'link', label: L('קישור', 'Link'), emoji: '🔗', placeholder: L('הדביקו כאן קישור, ואפשר להוסיף כמה מילים עליו', 'Paste a link here, and add a few words about it if you like') },
  { value: 'task', label: L('משימה', 'Task'), emoji: '✅', placeholder: L('למשל: לקבוע תור לרופא ביום ראשון', "e.g. Book a doctor's appointment on Sunday") },
  { value: 'idea', label: L('רעיון', 'Idea'), emoji: '💡', placeholder: L('למשל: רעיון לפתוח פודקאסט על עסקים', 'e.g. Idea: start a podcast about small businesses') },
  { value: 'list', label: L('רשימה', 'List'), emoji: '🛒', placeholder: L('למשל: חלב, ביצים, לחם ועגבניות', 'e.g. Bread, tomatoes, lentils and bananas') },
  { value: 'image', label: L('תמונה', 'Image'), emoji: '🖼️', placeholder: L('מה יש בתמונה? (לא חובה)', "What's in the picture? (optional)") },
];

export function Composer() {
  const nav = useNav();
  const store = useStore();
  const { open, hint: initialHint, initialText, initialImage } = nav.composer;
  const [text, setText] = useState('');
  const [hint, setHint] = useState<ContentType>('text');
  const [image, setImage] = useState<string>();
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [picked, setPicked] = useState<CategoryId | null>(null);
  const [saving, setSaving] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setText(initialText ?? '');
      setHint(initialImage ? 'image' : (initialHint ?? 'text'));
      setImage(initialImage);
      setPicked(null);
      setResult(null);
      setTimeout(() => taRef.current?.focus(), 80);
      if (initialHint === 'image') setTimeout(() => fileRef.current?.click(), 120);
    }
  }, [open, initialHint, initialText, initialImage]);

  // live classification while typing
  useEffect(() => {
    if (!open) return;
    if (!text.trim() && !image) return setResult(null);
    const t = window.setTimeout(async () => {
      const r = await classifier.classify({ text: text || L('צילום מסך', 'Screenshot'), hint: hint === 'text' || hint === 'link' ? undefined : hint, hasImage: !!image });
      setResult(r);
    }, 220);
    return () => window.clearTimeout(t);
  }, [text, hint, image, open]);

  const category = picked ?? result?.category ?? null;
  const typeMeta = TYPES.find((t) => t.value === hint)!;
  const canSave = (text.trim().length > 0 || !!image) && !!result && !saving;

  const alternatives = useMemo(() => {
    if (!result) return [];
    const list = [result.category, ...result.alternatives];
    return [...list, ...CATEGORIES.map((c) => c.id).filter((c) => !list.includes(c))];
  }, [result]);

  async function save() {
    if (!canSave || !result) return;
    setSaving(true);
    const item = await store.addFromClassification(text.trim() || L('צילום מסך', 'Screenshot'), result, { image, category: picked ?? undefined });
    setSaving(false);
    nav.closeComposer();
    nav.markFiled(item.category);
    const c = CATEGORY_BY_ID[item.category];
    store.showToast({ text: L(`נשמר ב${c.name}`, `Saved to ${c.name}`), emoji: c.emoji, action: { label: L('לפריט', 'View'), run: () => nav.go({ name: 'item', id: item.id }) } });
  }

  async function paste() {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setText((prev) => (prev ? prev + ' ' : '') + t);
      taRef.current?.focus();
    } catch {
      taRef.current?.focus();
      store.showToast({ text: L('לחיצה ארוכה בשדה ואז "הדבק"', 'Long-press the box, then "Paste"'), emoji: '📋' });
    }
  }

  async function onFile(f?: File) {
    if (!f) return;
    try {
      setImage(await fileToDataUrl(f));
      setHint('image');
    } catch {
      store.showToast({ text: L('לא הצלחנו לקרוא את התמונה. נסו קובץ JPG או PNG', "We couldn't read that image. Try a JPG or PNG file"), emoji: '⚠️' });
    }
  }

  return (
    <Sheet open={open} onClose={nav.closeComposer} labelledBy="composer-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="composer-title" className="font-display text-xl font-semibold">
          {L('מה שומרים?', 'What are we saving?')}
        </h2>
        <button onClick={nav.closeComposer} className="pressable grid h-9 w-9 place-items-center rounded-full bg-sunken" aria-label={L('סגירה', 'Close')}>
          <X size={18} />
        </button>
      </div>

      <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setHint(t.value);
              setPicked(null);
              if (t.value === 'image') fileRef.current?.click();
              else taRef.current?.focus();
            }}
            className={`pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold ${
              hint === t.value ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface text-ink hover:bg-sunken'
            }`}
          >
            <span aria-hidden>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-line bg-bg p-3 focus-within:border-brand/60">
        {image && (
          <div className="relative mb-3 inline-block">
            <img src={image} alt={L('התמונה שנבחרה', 'The chosen image')} className="max-h-40 rounded-2xl" />
            <button onClick={() => setImage(undefined)} className="absolute -end-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-ink text-bg shadow" aria-label={L('הסר תמונה', 'Remove image')}>
              <X size={14} />
            </button>
          </div>
        )}
        <textarea
          id="composer-text"
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
          }}
          onPaste={(e) => {
            const f = [...e.clipboardData.files].find((x) => x.type.startsWith('image/'));
            if (f) {
              e.preventDefault();
              onFile(f);
            }
          }}
          rows={hint === 'list' ? 5 : 3}
          placeholder={typeMeta.placeholder}
          className="block w-full resize-none bg-transparent text-[17px] leading-relaxed outline-none placeholder:text-faint"
        />
        <div className="mt-2 flex items-center gap-1 border-t border-line pt-2">
          <button onClick={paste} className="pressable inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold text-muted hover:bg-sunken">
            <ClipboardPaste size={15} /> {L('הדבקה', 'Paste')}
          </button>
          <button onClick={() => fileRef.current?.click()} className="pressable inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold text-muted hover:bg-sunken">
            <ImagePlus size={15} /> {L('תמונה או צילום מסך', 'Image or screenshot')}
          </button>
          <input ref={fileRef} id="composer-file" type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      </div>

      {/* AI preview */}
      <div className="mt-4 min-h-[92px]" aria-live="polite">
        {result && category ? (
          <div className="animate-fade-in">
            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-muted">
              <Sparkles size={14} className="text-brand" />
              {picked ? L('יישמר ב:', 'Will be saved to:') : result.confidence >= 0.75 ? L('נראה שזה שייך ל:', 'Looks like it belongs in:') : L('לא בטוחים, זה נראה כמו:', 'Not sure, it looks like:')}
              {!picked && (
                <span className="tabular rounded-full bg-sunken px-1.5 text-[11px] text-faint" title={L('רמת ביטחון', 'Confidence')}>
                  {Math.round(result.confidence * 100)}%
                </span>
              )}
            </div>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {alternatives.map((id) => {
                const c = CATEGORY_BY_ID[id];
                const active = id === category;
                return (
                  <button
                    key={id}
                    onClick={() => setPicked(id)}
                    aria-pressed={active}
                    className={`pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold ${active ? 'ring-2 ring-current' : 'opacity-70 hover:opacity-100'}`}
                    style={{ ...toneBg(id), ...toneInk(id) }}
                  >
                    <span aria-hidden>{c.emoji}</span>
                    {c.name}
                  </button>
                );
              })}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted">
              <span>
                {L('כותרת:', 'Title:')} <b className="font-semibold text-ink">{result.title}</b>
              </span>
              {category === 'tasks' && result.dueDate && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={13} /> {formatDue(result.dueDate)} {result.dueTime}
                </span>
              )}
              {category === 'shopping' && result.listItems.length >= 2 && <span>🛒 {L(`${result.listItems.length} מוצרים יהפכו לרשימה`, `${result.listItems.length} items will become a checklist`)}</span>}
              {result.tags.length > 0 && <span>{result.tags.map((t) => '#' + t).join(' ')}</span>}
            </div>
          </div>
        ) : (
          <p className="pt-2 text-[14px] text-faint">{L('כתבו או הדביקו משהו, והמסדר כבר יציע לאן הוא שייך.', 'Type or paste something, and Hamesader will suggest where it belongs.')}</p>
        )}
      </div>

      <button
        onClick={save}
        disabled={!canSave}
        className="pressable mt-3 h-14 w-full rounded-2xl bg-brand font-display text-[17px] font-semibold text-brand-ink shadow-fab transition-opacity disabled:opacity-40 disabled:shadow-none"
      >
        {category ? L(`שמור ב${CATEGORY_BY_ID[category].name}`, `Save to ${CATEGORY_BY_ID[category].name}`) : L('שמור', 'Save')}
      </button>
      <p className="mt-2 hidden text-center text-[12px] text-faint sm:block">{L('Ctrl + Enter לשמירה מהירה', 'Ctrl + Enter to save quickly')}</p>
    </Sheet>
  );
}
