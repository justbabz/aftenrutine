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
      className={`relative aspect-square w-full rounded-3xl p-3 flex flex-col items-center
        transition-all duration-200 ease-out-expo select-none
        active:scale-95
        ${done
          ? `${t.done} ${t.doneText} shadow-soft`
          : "bg-white text-ink-900 shadow-soft active:shadow-none"}`}
    >
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        {hasImage ? (
          <img
            src={pictogramUrl(task.arasaacId as number)}
            alt=""
            aria-hidden
            className={`h-[64%] w-auto max-w-[80%] object-contain transition-opacity ${done ? "opacity-80" : "opacity-100"}`}
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className="leading-none"
            style={{ fontSize: "clamp(3.5rem, 9vw, 5rem)" }}
            aria-hidden
          >
            {task.emoji}
          </span>
        )}
      </div>

      <span className={`block w-full text-center text-sm sm:text-base font-bold leading-tight line-clamp-2 ${done ? "text-white/95" : "text-ink-900"}`}>
        {task.label}
      </span>

      {done && (
        <div className="absolute top-2 right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow animate-scale-in">
          <svg viewBox="0 0 24 24" className={`w-4 h-4 ${t.text}`} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}
