import { useApp } from "../state/AppContext";
import { RoutineSlot, Task } from "../data/types";
import { SLOT_META, themeFor } from "../styles/theme";
import { defaultRoutineTasks } from "../data/defaultRoutines";

interface RoutineEditorProps {
  profileId: string;
  slot: RoutineSlot;
}

export function RoutineEditor({ profileId, slot }: RoutineEditorProps) {
  const { profile, routineTasks, setRoutineTasks, goBack, goto, pushToast } = useApp();
  const p = profile(profileId);
  const tasks = routineTasks(profileId, slot);

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

  const move = (taskId: string, delta: -1 | 1) => {
    const i = tasks.findIndex((tk) => tk.id === taskId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= tasks.length) return;
    const next = tasks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setRoutineTasks(profileId, slot, next);
  };

  const remove = (taskId: string) => {
    const snapshot = tasks.slice();
    const next = tasks.filter((tk) => tk.id !== taskId);
    setRoutineTasks(profileId, slot, next);
    pushToast("Opgave slettet", () => setRoutineTasks(profileId, slot, snapshot));
  };

  return (
    <div className="min-h-dvh bg-cream-50 flex flex-col pt-safe pb-safe">
      <header className="px-5 pt-4 pb-3 flex items-center gap-3">
        <button onClick={goBack} aria-label="Tilbage" className="w-12 h-12 rounded-full bg-white shadow-soft flex items-center justify-center active:scale-95">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-ink-700" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-ink-900 leading-tight">{meta.icon} {meta.label}</h1>
          <p className="text-ink-500 text-sm">{p.name}'s rutine · {tasks.length} opgaver</p>
        </div>
      </header>

      <main className="flex-1 px-5 py-4 flex flex-col gap-3 max-w-md mx-auto w-full">
        {tasks.length === 0 && (
          <div className="bg-white rounded-3xl shadow-soft p-8 text-center flex flex-col items-center gap-3">
            <div className="text-5xl">📝</div>
            <h2 className="text-xl font-bold text-ink-900">Ingen opgaver endnu</h2>
            <p className="text-ink-500">Start fra bunden eller brug en skabelon.</p>
            <button
              onClick={() => {
                const template = defaultRoutineTasks(slot);
                setRoutineTasks(profileId, slot, template);
                pushToast(`Skabelon brugt (${template.length} opgaver)`, () => setRoutineTasks(profileId, slot, []));
              }}
              className={`mt-2 ${t.bg} text-white font-bold text-base px-6 py-3 rounded-2xl shadow-soft active:scale-95 transition-transform`}
            >
              Brug skabelon
            </button>
          </div>
        )}

        {tasks.map((task, idx) => (
          <TaskRow
            key={task.id}
            task={task}
            isFirst={idx === 0}
            isLast={idx === tasks.length - 1}
            colorAccent={t.text}
            onEdit={() => goto({ kind: "admin-task", profileId, slot, taskId: task.id })}
            onUp={() => move(task.id, -1)}
            onDown={() => move(task.id, 1)}
            onDelete={() => remove(task.id)}
          />
        ))}

        <button
          onClick={() => goto({ kind: "admin-task", profileId, slot, taskId: "new" })}
          className={`mt-2 ${t.bg} text-white font-bold text-base py-4 rounded-3xl shadow-lift active:scale-95 transition-transform`}
        >
          + Tilføj opgave
        </button>
      </main>
    </div>
  );
}

function TaskRow({
  task, isFirst, isLast, colorAccent, onEdit, onUp, onDown, onDelete,
}: {
  task: Task;
  isFirst: boolean;
  isLast: boolean;
  colorAccent: string;
  onEdit: () => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-soft p-3 flex items-center gap-2">
      <button
        onClick={onEdit}
        className="flex-1 flex items-center gap-3 text-left p-2 rounded-2xl active:bg-cream-100 transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl bg-cream-100 flex items-center justify-center text-2xl shrink-0" aria-hidden>{task.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-ink-900 truncate">{task.label}</div>
          {task.arasaacId !== null && (
            <div className={`text-xs ${colorAccent} font-semibold`}>Piktogram</div>
          )}
        </div>
      </button>
      <div className="flex flex-col gap-1">
        <button
          onClick={onUp}
          disabled={isFirst}
          aria-label="Flyt op"
          className="w-9 h-9 rounded-xl bg-cream-100 flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-ink-700" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <button
          onClick={onDown}
          disabled={isLast}
          aria-label="Flyt ned"
          className="w-9 h-9 rounded-xl bg-cream-100 flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-ink-700" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
      <button
        onClick={onDelete}
        aria-label="Slet opgave"
        className="w-10 h-10 rounded-xl bg-bad-soft flex items-center justify-center active:scale-90 transition-transform"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-bad-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
      </button>
    </div>
  );
}
