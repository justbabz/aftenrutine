import { ProfileColor, Task } from "../data/types";
import { themeFor } from "../styles/theme";
import { TaskCard } from "./TaskCard";

interface ChecklistGridProps {
  tasks: Task[];
  done: (taskId: string) => boolean;
  onToggle: (taskId: string) => void;
  color: ProfileColor;
}

export function ChecklistGrid({ tasks, done, onToggle, color }: ChecklistGridProps) {
  const t = themeFor(color);
  const total = tasks.length;
  const doneCount = tasks.filter((tk) => done(tk.id)).length;
  const pct = total === 0 ? 0 : (doneCount / total) * 100;

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-4 rounded-full bg-ink-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${t.bg} transition-all duration-500 ease-out-expo`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={`text-base font-bold ${t.text} tabular-nums`}>
          {doneCount}/{total}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-soft p-8 text-center">
          <div className="text-5xl mb-3">📝</div>
          <h3 className="text-xl font-bold text-ink-900 mb-1">Ingen opgaver endnu</h3>
          <p className="text-ink-500">En voksen kan tilføje opgaver i forælder-indstillinger.</p>
        </div>
      ) : (
        <div
          className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          <ol className="flex gap-3 items-stretch w-max min-w-full justify-center">
            {tasks.map((task, idx) => (
              <li
                key={task.id}
                className="snap-center shrink-0 flex flex-col items-center gap-1"
                style={{ width: "clamp(120px, 16vw, 180px)" }}
              >
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-soft text-ink-500 text-xs font-bold"
                  aria-hidden
                >
                  {idx + 1}
                </span>
                <TaskCard
                  task={task}
                  done={done(task.id)}
                  color={color}
                  onToggle={() => onToggle(task.id)}
                />
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
