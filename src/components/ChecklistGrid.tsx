import { useEffect, useRef, useState } from "react";
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastDoneCountRef = useRef(doneCount);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [tasks.length]);

  // Auto-scroll to the next undone task when a task is completed.
  useEffect(() => {
    const prev = lastDoneCountRef.current;
    lastDoneCountRef.current = doneCount;
    if (doneCount <= prev) return;            // Not a completion (uncheck or initial)
    if (doneCount === tasks.length) return;   // All done — let celebration take over

    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollWidth <= el.clientWidth + 4) return;  // Nothing to scroll

    const cards = el.querySelectorAll<HTMLElement>("li[data-task]");
    const nextIdx = tasks.findIndex((tk) => !done(tk.id));
    const card = cards[nextIdx];
    if (!card) return;

    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const target = Math.max(0, Math.min(
      el.scrollWidth - el.clientWidth,
      cardCenter - el.clientWidth / 2,
    ));
    el.scrollTo({ left: target, behavior: "smooth" });
  }, [doneCount, tasks, done]);

  return (
    <div className="flex flex-col gap-6 w-full items-center">
      <div className="flex items-center gap-3 w-full max-w-md px-4">
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
        <div className="bg-white rounded-3xl shadow-soft p-8 text-center max-w-md mx-4">
          <div className="text-5xl mb-3">📝</div>
          <h3 className="text-xl font-bold text-ink-900 mb-1">Ingen opgaver endnu</h3>
          <p className="text-ink-500">En voksen kan tilføje opgaver i forælder-indstillinger.</p>
        </div>
      ) : (
        <div className="relative w-full">
          <div
            ref={scrollRef}
            className="w-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
            style={{ scrollbarWidth: "none" }}
          >
            <ol
              className="flex flex-nowrap gap-4 items-stretch mx-auto w-max"
            >
              {/* Mobile-only spacer so the first card can sit in the middle with neighbour peeking */}
              <li aria-hidden className="shrink-0 sm:hidden" style={{ width: "max(0px, calc(50vw - 110px))" }} />
              {tasks.map((task, idx) => (
                <li
                  key={task.id}
                  data-task
                  className="snap-center shrink-0 flex flex-col items-center gap-2"
                  style={{ width: "clamp(200px, 16vw, 240px)" }}
                >
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-soft text-ink-500 text-sm font-bold"
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
              <li aria-hidden className="shrink-0 sm:hidden" style={{ width: "max(0px, calc(50vw - 110px))" }} />
            </ol>
          </div>

          {/* Subtle fade-out edges to hint at more content without looking clickable */}
          <div
            aria-hidden
            className={`pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-cream-50 to-transparent transition-opacity duration-300 ${canLeft ? "opacity-100" : "opacity-0"}`}
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-cream-50 to-transparent transition-opacity duration-300 ${canRight ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      )}
    </div>
  );
}
