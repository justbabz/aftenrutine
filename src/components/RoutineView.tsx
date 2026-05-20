import { useEffect, useState } from "react";
import { useApp } from "../state/AppContext";
import { RoutineSlot } from "../data/types";
import { SLOT_META, themeFor } from "../styles/theme";
import { ChecklistGrid } from "./ChecklistGrid";
import { CelebrationOverlay } from "./CelebrationOverlay";

interface RoutineViewProps {
  profileId: string;
  slot: RoutineSlot;
}

export function RoutineView({ profileId, slot }: RoutineViewProps) {
  const { profile, goBack, replaceScreen, toggleTask, isDone, routineTasks } = useApp();
  const p = profile(profileId);
  const [celebrated, setCelebrated] = useState(false);

  if (!p) {
    return (
      <div className="min-h-dvh bg-cream-50 flex flex-col items-center justify-center p-6 gap-3">
        <p className="text-ink-700">Profilen findes ikke længere.</p>
        <button onClick={goBack} className="bg-brand-600 text-white px-5 py-3 rounded-2xl font-bold">Tilbage</button>
      </div>
    );
  }

  const t = themeFor(p.color);
  const meta = SLOT_META[slot];
  const tasks = routineTasks(profileId, slot);
  const doneCount = tasks.filter((tk) => isDone(profileId, slot, tk.id)).length;
  const allDone = tasks.length > 0 && doneCount === tasks.length;

  useEffect(() => {
    if (allDone) setCelebrated(true);
    if (!allDone) setCelebrated(false);
  }, [allDone]);

  const switchSlot = (next: RoutineSlot) => {
    if (next !== slot) replaceScreen({ kind: "routine", profileId, slot: next });
  };

  return (
    <div className="min-h-dvh bg-cream-50 flex flex-col pt-safe pb-safe">
      <header className={`bg-gradient-to-b ${t.gradient} text-white px-5 pt-4 pb-6`}>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={goBack}
            aria-label="Tilbage"
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="text-3xl" aria-hidden>{p.avatar.emoji}</div>
        </div>
        <h1 className="text-3xl font-black leading-tight drop-shadow-sm">{p.name}</h1>
        <p className="text-white/90 text-base mt-0.5">{meta.subtitle}</p>

        <div className="mt-5 bg-white/15 backdrop-blur p-1.5 rounded-3xl flex gap-1.5">
          <SlotTab label="Morgen" icon="🌅" active={slot === "morning"} onClick={() => switchSlot("morning")} />
          <SlotTab label="Aften" icon="🌙" active={slot === "evening"} onClick={() => switchSlot("evening")} />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 w-full">
        <ChecklistGrid
          tasks={tasks}
          done={(id) => isDone(profileId, slot, id)}
          onToggle={(id) => toggleTask(profileId, slot, id)}
          color={p.color}
        />
      </main>

      {allDone && celebrated && (
        <CelebrationOverlay
          slot={slot}
          color={p.color}
          childName={p.name}
          onClose={() => setCelebrated(false)}
        />
      )}
    </div>
  );
}

function SlotTab({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xl transition-all duration-200 active:scale-[0.97]
        ${active ? "bg-white text-ink-900 shadow-lift" : "text-white/90 hover:bg-white/10"}`}
    >
      <span className="text-3xl" aria-hidden>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
