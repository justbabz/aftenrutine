import { useState, useEffect } from "react";
import { TASKS } from "../data/tasks";

interface ChecklistState {
  date: string;
  checked: Record<string, boolean>;
}

const STORAGE_KEY = "aftenrutine-v1";

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: ChecklistState = JSON.parse(raw);
    if (parsed.date !== todayString()) return {};
    return parsed.checked;
  } catch {
    return {};
  }
}

function saveState(checked: Record<string, boolean>): void {
  const state: ChecklistState = { date: todayString(), checked };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>(loadState);

  useEffect(() => {
    saveState(checked);
  }, [checked]);

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const reset = () => {
    setChecked({});
  };

  const allDone = TASKS.every((t) => checked[t.id]);

  return { checked, toggle, reset, allDone };
}
