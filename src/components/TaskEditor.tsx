import { useMemo, useState } from "react";
import { useApp } from "../state/AppContext";
import { RoutineSlot, Task } from "../data/types";
import { themeFor } from "../styles/theme";
import {
  EMOJI_CATEGORIES,
  EMOJI_LIBRARY,
  EmojiCategory,
  EmojiOption,
  flatEmojiOptions,
} from "../data/taskEmojis";

interface TaskEditorProps {
  profileId: string;
  slot: RoutineSlot;
  taskId: string | "new";
}

function genId(): string {
  return crypto.randomUUID();
}

export function TaskEditor({ profileId, slot, taskId }: TaskEditorProps) {
  const { profile, routineTasks, setRoutineTasks, goBack, pushToast } = useApp();
  const p = profile(profileId);
  const tasks = routineTasks(profileId, slot);
  const existing = taskId === "new" ? null : tasks.find((t) => t.id === taskId) ?? null;

  const [label, setLabel] = useState(existing?.label ?? "");
  const [emoji, setEmoji] = useState(existing?.emoji ?? "🪥");
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>("hygiejne");
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return flatEmojiOptions().filter((o) =>
      o.label.toLowerCase().includes(q) || o.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [query]);

  if (!p) {
    return (
      <div className="min-h-dvh bg-cream-50 flex flex-col items-center justify-center p-6 gap-3">
        <p className="text-ink-700">Profilen findes ikke længere.</p>
        <button onClick={goBack} className="bg-brand-600 text-white px-5 py-3 rounded-2xl font-bold">Tilbage</button>
      </div>
    );
  }

  const t = themeFor(p.color);
  const canSave = label.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    let next: Task[];
    if (existing) {
      next = tasks.map((tk) =>
        tk.id === existing.id ? { ...tk, label: label.trim(), emoji, arasaacId: tk.arasaacId } : tk,
      );
    } else {
      next = [...tasks, { id: genId(), label: label.trim(), emoji, arasaacId: null }];
    }
    setRoutineTasks(profileId, slot, next);
    goBack();
    pushToast(existing ? "Opgave opdateret" : "Opgave tilføjet");
  };

  const pickOption = (option: EmojiOption) => {
    setEmoji(option.emoji);
    if (!label.trim()) setLabel(option.label);
  };

  return (
    <div className="min-h-dvh bg-cream-50 flex flex-col pt-safe pb-safe">
      <header className="px-5 pt-4 pb-3 flex items-center gap-3">
        <button onClick={goBack} aria-label="Tilbage" className="w-12 h-12 rounded-full bg-white shadow-soft flex items-center justify-center active:scale-95">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-ink-700" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="text-2xl font-black text-ink-900 flex-1">{existing ? "Rediger opgave" : "Ny opgave"}</h1>
      </header>

      <main className="flex-1 px-5 py-4 flex flex-col gap-5 max-w-md mx-auto w-full overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-soft p-5 flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-cream-100 flex items-center justify-center text-5xl shrink-0" aria-hidden>{emoji}</div>
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Tekst</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Fx Børste tænder"
              maxLength={30}
              autoFocus
              className="w-full bg-transparent border-0 outline-none text-lg font-bold text-ink-900 placeholder:text-ink-300 mt-0.5"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-ink-700 px-1">Vælg billede</label>
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søg..."
              className="w-full bg-white border-2 border-ink-100 focus:border-brand-400 outline-none rounded-2xl px-5 py-3 text-base text-ink-900 placeholder:text-ink-300 shadow-soft transition-colors"
            />
          </div>
          {!searchResults && (
            <div className="flex gap-2 overflow-x-auto -mx-5 px-5 py-1 scrollbar-none">
              {(Object.keys(EMOJI_CATEGORIES) as EmojiCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-colors
                    ${activeCategory === cat ? `${t.bg} text-white shadow-soft` : "bg-white text-ink-700 shadow-soft active:bg-cream-100"}`}
                >
                  {EMOJI_CATEGORIES[cat]}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 mt-1">
            {(searchResults ?? EMOJI_LIBRARY[activeCategory]).map((o) => {
              const selected = emoji === o.emoji && (!searchResults || label === o.label);
              return (
                <button
                  key={`${o.emoji}-${o.label}`}
                  onClick={() => pickOption(o)}
                  aria-label={o.label}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 p-2 transition-all duration-150 active:scale-95
                    ${selected ? `${t.bgSoft} ring-2 ${t.ring}` : "bg-white shadow-soft"}`}
                >
                  <span className="text-3xl leading-none" aria-hidden>{o.emoji}</span>
                  <span className="text-[10px] font-semibold text-ink-500 text-center leading-tight line-clamp-1">{o.label}</span>
                </button>
              );
            })}
            {searchResults && searchResults.length === 0 && (
              <div className="col-span-4 text-center text-ink-500 py-6">Ingen resultater</div>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`mt-2 ${t.bg} text-white text-lg font-bold py-4 rounded-3xl shadow-lift active:scale-95 transition-transform disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none`}
        >
          {existing ? "Gem ændringer" : "Tilføj opgave"}
        </button>
      </main>
    </div>
  );
}
