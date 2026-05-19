import { useState } from "react";
import { Task, pictogramUrl } from "../data/tasks";

interface TaskCardProps {
  task: Task;
  done: boolean;
  onToggle: () => void;
}

export function TaskCard({ task, done, onToggle }: TaskCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onToggle}
      className={`
        relative flex flex-col items-center justify-between
        rounded-2xl p-3 gap-2 select-none
        transition-all duration-200 active:scale-95
        min-h-[9rem] w-full
        ${done
          ? "bg-green-400 shadow-inner"
          : "bg-white shadow-md hover:shadow-lg"
        }
      `}
      aria-pressed={done}
      aria-label={task.label}
    >
      {/* Piktogram */}
      <div className="flex-1 flex items-center justify-center w-full">
        {imgError ? (
          <span className="text-5xl">{task.emoji}</span>
        ) : (
          <img
            src={pictogramUrl(task.arasaacId)}
            alt={task.label}
            className={`max-h-20 max-w-full object-contain transition-opacity duration-200 ${done ? "opacity-60" : "opacity-100"}`}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Label */}
      <span className={`text-sm font-semibold text-center leading-tight ${done ? "text-green-900" : "text-gray-700"}`}>
        {task.label}
      </span>

      {/* Hak */}
      {done && (
        <div className="absolute top-2 right-2 bg-green-600 rounded-full w-7 h-7 flex items-center justify-center shadow">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-none stroke-white stroke-[3]">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}
