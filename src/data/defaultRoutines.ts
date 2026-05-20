import { Task, RoutineSlot } from "./types";

interface TemplateEntry {
  label: string;
  emoji: string;
  arasaacId: number | null;
}

const MORNING_TEMPLATE: TemplateEntry[] = [
  { label: "Stå op", emoji: "🛏️", arasaacId: null },
  { label: "Tisse af", emoji: "🚽", arasaacId: 38625 },
  { label: "Spise morgenmad", emoji: "🥣", arasaacId: null },
  { label: "Børste tænder", emoji: "🪥", arasaacId: 2087 },
  { label: "Tage tøj på", emoji: "👕", arasaacId: null },
  { label: "Pakke taske", emoji: "🎒", arasaacId: null },
];

const EVENING_TEMPLATE: TemplateEntry[] = [
  { label: "Spise aftensmad", emoji: "🍽️", arasaacId: null },
  { label: "Lege", emoji: "🧸", arasaacId: null },
  { label: "Tisse af", emoji: "🚽", arasaacId: 38625 },
  { label: "Tage nattøj på", emoji: "🛌", arasaacId: null },
  { label: "Børste tænder", emoji: "🪥", arasaacId: 2087 },
  { label: "Læse bog", emoji: "📖", arasaacId: null },
  { label: "Sove", emoji: "😴", arasaacId: 2369 },
];

function genId(): string {
  return crypto.randomUUID();
}

function materialise(entries: TemplateEntry[]): Task[] {
  return entries.map((e) => ({ id: genId(), label: e.label, emoji: e.emoji, arasaacId: e.arasaacId }));
}

export function defaultRoutineTasks(slot: RoutineSlot): Task[] {
  return slot === "morning" ? materialise(MORNING_TEMPLATE) : materialise(EVENING_TEMPLATE);
}
