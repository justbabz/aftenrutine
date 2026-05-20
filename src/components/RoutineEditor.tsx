import { useState } from "react";
import { useApp } from "../state/AppContext";
import { RoutineSlot, Task, Weekday, WEEKDAYS, WEEKDAY_LABELS } from "../data/types";
import { SLOT_META, themeFor } from "../styles/theme";
import { defaultRoutineTasks } from "../data/defaultRoutines";

interface RoutineEditorProps {
  profileId: string;
  slot: RoutineSlot;
  weekday: Weekday;
}

export function RoutineEditor({ profileId, slot, weekday }: RoutineEditorProps) {
  const { profile, routineTasks, setRoutineTasks, copyRoutineToDays, goBack, goto, replaceScreen, pushToast } = useApp();
  const p = profile(profileId);
  const tasks = routineTasks(profileId, slot, weekday);
  const [showCopy, setShowCopy] = useState(false);
  const [copyTargets, setCopyTargets] = useState<Set<Weekday>>(new Set());

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

  const switchWeekday = (next: Weekday) => {
    if (next !== weekday) replaceScreen({ kind: "admin-routine", profileId, slot, weekday: next });
  };

  const move = (taskId: string, delta: -1 | 1) => {
    const i = tasks.findIndex((tk) => tk.id === taskId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= tasks.length) return;
    const next = tasks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setRoutineTasks(profileId, slot, weekday, next);
  };

  const remove = (taskId: string) => {
    const snapshot = tasks.slice();
    const next = tasks.filter((tk) => tk.id !== taskId);
    setRoutineTasks(profileId, slot, weekday, next);
    pushToast("Opgave slettet", () => setRoutineTasks(profileId, slot, weekday, snapshot));
  };

  const handleCopy = () => {
    if (copyTargets.size === 0) return;
    const before = p.routines[slot];
    const targets = Array.from(copyTargets);
    copyRoutineToDays(profileId, slot, weekday, targets);
    setShowCopy(false);
    setCopyTargets(new Set());
    const label = targets.length === WEEKDAYS.length - 1
      ? "alle andre dage"
      : targets.length === 1
        ? WEEKDAY_LABELS[targets[0]].full.toLowerCase()
        : `${targets.length} dage`;
    pushToast(
      `Kopieret til ${label}`,
      () => {
        for (const day of targets) {
          setRoutineTasks(profileId, slot, day, before[day].tasks);
        }
      },
    );
  };

  const otherDays = WEEKDAYS.filter((d) => d !== weekday);
  const allSelected = otherDays.every((d) => copyTargets.has(d));
  const toggleTarget = (day: Weekday) => {
    setCopyTargets((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setCopyTargets((prev) => {
      if (otherDays.every((d) => prev.has(d))) return new Set();
      return new Set(otherDays);
    });
  };
  const openCopy = () => {
    setCopyTargets(new Set());
    setShowCopy(true);
  };

  return (
    <div className="min-h-dvh bg-cream-50 flex flex-col pt-safe pb-safe">
      <header className="px-5 pt-4 pb-3 flex items-center gap-3">
        <button onClick={goBack} aria-label="Tilbage" className="w-12 h-12 rounded-full bg-white shadow-soft flex items-center justify-center active:scale-95">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-ink-700" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-ink-900 leading-tight">{meta.icon} {meta.label}</h1>
          <p className="text-ink-500 text-sm">{p.name}'s rutine</p>
        </div>
      </header>

      <div className="px-5 pb-3 overflow-x-auto -mx-1">
        <div className="flex justify-center gap-2 px-1 min-w-max mx-auto">
          {WEEKDAYS.map((day) => {
            const active = day === weekday;
            const dayTaskCount = p.routines[slot][day].tasks.length;
            return (
              <button
                key={day}
                onClick={() => switchWeekday(day)}
                aria-pressed={active}
                className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl font-bold transition-all duration-150 active:scale-95
                  ${active ? `${t.bg} text-white shadow-lift` : "bg-white text-ink-700 shadow-soft"}`}
              >
                <span className="text-sm">{WEEKDAY_LABELS[day].short}</span>
                <span className={`text-[10px] font-bold ${active ? "text-white/80" : "text-ink-400"}`}>{dayTaskCount}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 px-5 pt-3 pb-32 flex flex-col gap-3 max-w-md mx-auto w-full">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="text-lg font-bold text-ink-700">{WEEKDAY_LABELS[weekday].full}</h2>
          {tasks.length > 0 && (
            <button
              onClick={openCopy}
              className="text-sm font-bold text-brand-600 active:text-brand-800 underline-offset-4 underline"
            >
              Kopier til...
            </button>
          )}
        </div>

        {tasks.length === 0 && (
          <div className="bg-white rounded-3xl shadow-soft p-8 text-center flex flex-col items-center gap-3">
            <div className="text-5xl">📝</div>
            <h2 className="text-xl font-bold text-ink-900">Ingen opgaver på {WEEKDAY_LABELS[weekday].full.toLowerCase()}</h2>
            <p className="text-ink-500">Start fra bunden eller brug en skabelon.</p>
            <button
              onClick={() => {
                const template = defaultRoutineTasks(slot);
                setRoutineTasks(profileId, slot, weekday, template);
                pushToast(`Skabelon brugt på ${WEEKDAY_LABELS[weekday].full.toLowerCase()}`, () => setRoutineTasks(profileId, slot, weekday, []));
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
            onEdit={() => goto({ kind: "admin-task", profileId, slot, weekday, taskId: task.id })}
            onUp={() => move(task.id, -1)}
            onDown={() => move(task.id, 1)}
            onDelete={() => remove(task.id)}
          />
        ))}

        <button
          onClick={() => goto({ kind: "admin-task", profileId, slot, weekday, taskId: "new" })}
          className={`mt-2 ${t.bg} text-white font-bold text-base py-4 rounded-3xl shadow-lift active:scale-95 transition-transform`}
        >
          + Tilføj opgave
        </button>
      </main>

      {showCopy && (
        <div className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-lift p-6 w-full max-w-md flex flex-col gap-4 animate-fade-up">
            <div>
              <h3 className="text-xl font-black text-ink-900">Kopier {WEEKDAY_LABELS[weekday].full.toLowerCase()}s opgaver til...</h3>
              <p className="text-ink-500 text-sm mt-1">
                Vælg en eller flere dage. Det overskriver hvad dagene havde i forvejen — men du kan fortryde.
              </p>
            </div>

            <button
              onClick={toggleSelectAll}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition-colors
                ${allSelected ? `${t.bg} text-white shadow-lift` : "bg-cream-100 text-ink-700"}`}
            >
              <span>Vælg alle dage</span>
              <span aria-hidden>{allSelected ? "✓" : ""}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {otherDays.map((day) => {
                const selected = copyTargets.has(day);
                const dayCount = p.routines[slot][day].tasks.length;
                return (
                  <button
                    key={day}
                    onClick={() => toggleTarget(day)}
                    aria-pressed={selected}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 transition-all active:scale-95
                      ${selected ? `${t.bg} text-white shadow-lift` : "bg-white text-ink-700 shadow-soft"}`}
                  >
                    <span className="font-bold">{WEEKDAY_LABELS[day].full}</span>
                    <span className={`text-xs font-bold ${selected ? "text-white/80" : "text-ink-400"}`}>{dayCount > 0 ? `${dayCount} →` : "tom"}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setShowCopy(false); setCopyTargets(new Set()); }}
                className="flex-1 bg-ink-100 text-ink-700 font-bold py-3 rounded-2xl active:scale-95 transition-transform"
              >
                Fortryd
              </button>
              <button
                onClick={handleCopy}
                disabled={copyTargets.size === 0}
                className={`flex-1 ${t.bg} text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform disabled:bg-ink-200 disabled:text-ink-400`}
              >
                Kopier {copyTargets.size > 0 ? `(${copyTargets.size})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task, isFirst, isLast, onEdit, onUp, onDown, onDelete,
}: {
  task: Task;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = task.arasaacId !== null && !imgError;
  return (
    <div className="bg-white rounded-3xl shadow-soft p-3 flex items-center gap-2">
      <button
        onClick={onEdit}
        className="flex-1 flex items-center gap-3 text-left p-2 rounded-2xl active:bg-cream-100 transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl bg-cream-100 flex items-center justify-center overflow-hidden shrink-0">
          {showImage ? (
            <img
              src={`https://static.arasaac.org/pictograms/${task.arasaacId}/${task.arasaacId}_300.png`}
              alt=""
              aria-hidden
              className="max-h-full max-w-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-2xl" aria-hidden>{task.emoji}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-ink-900 truncate">{task.label}</div>
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
