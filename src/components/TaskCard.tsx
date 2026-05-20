import { useState } from "react";
import { Task } from "../data/types";
import { themeFor } from "../styles/theme";
import { ProfileColor } from "../data/types";

interface TaskCardProps {
  task: Task;
  done: boolean;
  color: ProfileColor;
  onToggle: () => void;
}

function pictogramUrl(arasaacId: number): string {
  return `https://static.arasaac.org/pictograms/${arasaacId}/${arasaacId}_300.png`;
}

export function TaskCard({ task, done, color, onToggle }: TaskCardProps) {
  const [imgError, setImgError] = useState(false);
  const t = themeFor(color);
  const hasImage = task.arasaacId !== null && !imgError;

  return (
    <button
      onClick={onToggle}
      aria-pressed={done}
      aria-label={`${task.label}${done ? " (klaret)" : ""}`}
      className={`relative aspect-[5/6] rounded-3xl p-4 flex flex-col items-center justify-between
        transition-all duration-200 ease-out-expo select-none
        active:scale-95
        ${done
          ? `${t.done} ${t.doneText} shadow-soft`
          : "bg-white text-ink-900 shadow-soft active:shadow-none"}`}
    >
      <div className="flex-1 flex items-center justify-center w-full">
        {hasImage ? (
          <img
            src={pictogramUrl(task.arasaacId as number)}
            alt=""
            aria-hidden
            className={`max-h-24 max-w-full object-contain transition-opacity ${done ? "opacity-90 brightness-0 invert" : "opacity-100"}`}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-6xl" aria-hidden>{task.emoji}</span>
        )}
      </div>

      <span className={`text-base font-bold text-center leading-tight mt-2 ${done ? "text-white/95" : "text-ink-900"}`}>
        {task.label}
      </span>

      {done && (
        <div className="absolute top-3 right-3 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow animate-scale-in">
          <svg viewBox="0 0 24 24" className={`w-5 h-5 ${t.text}`} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}
