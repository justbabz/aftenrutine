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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              done={done(task.id)}
              color={color}
              onToggle={() => onToggle(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
