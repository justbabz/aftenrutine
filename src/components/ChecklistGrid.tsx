import { TASKS } from "../data/tasks";
import { TaskCard } from "./TaskCard";

interface ChecklistGridProps {
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export function ChecklistGrid({ checked, onToggle }: ChecklistGridProps) {
  const doneCount = TASKS.filter((t) => checked[t.id]).length;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Fremskridtsbjælke */}
      <div className="w-full bg-purple-100 rounded-full h-4 overflow-hidden">
        <div
          className="bg-purple-500 h-4 rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / TASKS.length) * 100}%` }}
        />
      </div>
      <p className="text-center text-purple-700 font-medium text-sm">
        {doneCount} af {TASKS.length} klaret
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TASKS.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            done={!!checked[task.id]}
            onToggle={() => onToggle(task.id)}
          />
        ))}
      </div>
    </div>
  );
}
