import { useMemo, useState } from "react";
import { useApp } from "../state/AppContext";
import { RoutineSlot, Task, Weekday, WEEKDAY_LABELS } from "../data/types";
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
  weekday: Weekday;
  taskId: string | "new";
}

function genId(): string {
  return crypto.randomUUID();
}

function extractEmoji(raw: string): string | null {
  if (!raw) return null;
  // Match emoji including ZWJ sequences, variation selectors, skin tones.
  const match = raw.match(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*/u);
  return match ? match[0] : null;
}

interface CustomEmojiInputProps {
  currentEmoji: string;
  onPick: (emoji: string) => void;
  accentRing: string;
  accentSoft: string;
}

function CustomEmojiInput({ currentEmoji, onPick, accentRing, accentSoft }: CustomEmojiInputProps) {
  const isCustom = !!currentEmoji && !flatEmojiOptions().some((o) => o.emoji === currentEmoji);
  return (
    <label
      className={`relative flex items-center gap-3 rounded-2xl shadow-soft p-3 cursor-text transition-colors
        border-2 border-dashed ${isCustom ? `${accentSoft} ${accentRing} border-current` : "bg-white border-brand-300"}
        focus-within:border-brand-500 focus-within:shadow-lift`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-cream-100 ${isCustom ? `ring-2 ${accentRing}` : ""}`} aria-hidden>
        <span className="text-3xl leading-none">{currentEmoji || "✏️"}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
          <span>Skriv din egen emoji</span>
          <span className="text-brand-600" aria-hidden>→</span>
        </div>
        <div className="text-xs text-ink-500 leading-snug">
          Tryk i feltet, og brug 🌐 eller smiley på dit tastatur for at vælge fra alle emojis
        </div>
      </div>
      <div className="relative shrink-0">
        <input
          type="text"
          value=""
          onChange={(e) => {
            const picked = extractEmoji(e.target.value);
            if (picked) onPick(picked);
            (e.target as HTMLInputElement).value = "";
          }}
          aria-label="Indtast en emoji"
          className="w-20 h-16 text-3xl text-center bg-brand-50 border-2 border-brand-300 focus:border-brand-500 focus:bg-white outline-none rounded-2xl transition-colors caret-brand-600"
          placeholder="🙂"
        />
        <div className="absolute -top-2 -right-2 bg-brand-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow pointer-events-none">
          Tryk her
        </div>
      </div>
    </label>
  );
}

export function TaskEditor({ profileId, slot, weekday, taskId }: TaskEditorProps) {
  const { profile, routineTasks, setRoutineTasks, goBack, pushToast } = useApp();
  const p = profile(profileId);
  const tasks = routineTasks(profileId, slot, weekday);
  const existing = taskId === "new" ? null : tasks.find((t) => t.id === taskId) ?? null;

  const [label, setLabel] = useState(existing?.label ?? "");
  const [emoji, setEmoji] = useState(existing?.emoji ?? "🪥");
  const [arasaacId, setArasaacId] = useState<number | null>(existing?.arasaacId ?? null);
  const [showArasaac, setShowArasaac] = useState(existing?.arasaacId != null);
  const [arasaacInput, setArasaacInput] = useState(existing?.arasaacId?.toString() ?? "");
  const [arasaacError, setArasaacError] = useState(false);
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
        tk.id === existing.id ? { ...tk, label: label.trim(), emoji, arasaacId } : tk,
      );
    } else {
      next = [...tasks, { id: genId(), label: label.trim(), emoji, arasaacId }];
    }
    setRoutineTasks(profileId, slot, weekday, next);
    goBack();
    pushToast(existing ? "Opgave opdateret" : "Opgave tilføjet");
  };

  const applyArasaacInput = (raw: string) => {
    setArasaacInput(raw);
    setArasaacError(false);
    const cleaned = raw.trim();
    if (!cleaned) {
      setArasaacId(null);
      return;
    }
    const n = parseInt(cleaned, 10);
    if (!Number.isFinite(n) || n <= 0) {
      setArasaacId(null);
      return;
    }
    setArasaacId(n);
  };

  const clearArasaac = () => {
    setArasaacId(null);
    setArasaacInput("");
    setArasaacError(false);
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
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-ink-900 leading-tight">{existing ? "Rediger opgave" : "Ny opgave"}</h1>
          <p className="text-ink-500 text-sm">{WEEKDAY_LABELS[weekday].full}</p>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 flex flex-col gap-5 max-w-md mx-auto w-full overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-soft p-5 flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-cream-100 flex items-center justify-center shrink-0 overflow-hidden">
            {arasaacId !== null && !arasaacError ? (
              <img
                src={`https://static.arasaac.org/pictograms/${arasaacId}/${arasaacId}_300.png`}
                alt=""
                aria-hidden
                className="max-h-full max-w-full object-contain"
                onError={() => setArasaacError(true)}
              />
            ) : (
              <span className="text-5xl" aria-hidden>{emoji}</span>
            )}
          </div>
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
          <CustomEmojiInput
            currentEmoji={emoji}
            onPick={(e) => { setEmoji(e); setArasaacId(null); setArasaacInput(""); setShowArasaac(false); }}
            accentRing={t.ring}
            accentSoft={t.bgSoft}
          />
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

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowArasaac((s) => !s)}
            className="bg-white rounded-2xl shadow-soft px-4 py-3 flex items-center justify-between text-left active:scale-[0.99] transition-transform"
          >
            <div className="flex flex-col">
              <span className="font-bold text-ink-900">Brug ARASAAC-piktogram</span>
              <span className="text-xs text-ink-500">
                {arasaacId ? `ID ${arasaacId}${arasaacError ? " (kunne ikke hentes)" : ""}` : "Avanceret · vælg et symbol via ID"}
              </span>
            </div>
            <svg viewBox="0 0 24 24" className={`w-5 h-5 text-ink-400 transition-transform ${showArasaac ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          {showArasaac && (
            <div className="bg-white rounded-3xl shadow-soft p-4 flex flex-col gap-4 animate-fade-up">
              <div className="bg-brand-50 rounded-2xl p-4 flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-black text-base" aria-hidden>i</div>
                <div className="flex-1 text-sm text-ink-700 leading-relaxed">
                  <p className="font-bold mb-1 text-ink-900">Sådan finder du et piktogram</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Åbn <span className="font-mono bg-white px-1.5 rounded text-xs">arasaac.org/pictograms/search</span></li>
                    <li>Søg på <span className="font-semibold">engelsk</span> (fx <span className="italic">toothbrush</span>) — dansk virker ikke endnu</li>
                    <li>Klik på et billede du kan lide</li>
                    <li>Kopier tallet fra adresselinjen (fx <span className="font-mono bg-white px-1.5 rounded">2087</span>)</li>
                    <li>Indsæt tallet herunder</li>
                  </ol>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={arasaacInput}
                  onChange={(e) => applyArasaacInput(e.target.value)}
                  placeholder="Fx 2087"
                  className="flex-1 bg-cream-100 border-2 border-transparent focus:border-brand-400 outline-none rounded-2xl px-4 py-3 text-base font-bold text-ink-900 placeholder:text-ink-300 transition-colors"
                />
                {arasaacId !== null && (
                  <button
                    onClick={clearArasaac}
                    className="bg-ink-100 text-ink-700 font-semibold px-3 py-3 rounded-2xl active:scale-95 transition-transform text-sm"
                  >
                    Fjern
                  </button>
                )}
              </div>
              {arasaacError && (
                <p className="text-bad-500 text-sm font-semibold">Det ID gav ikke noget billede. Tjek tallet på arasaac.org/pictograms/search.</p>
              )}
            </div>
          )}
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
