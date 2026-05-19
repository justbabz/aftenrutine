export interface Task {
  id: string;
  label: string;
  arasaacId: number;
  emoji: string;
}

export const TASKS: Task[] = [
  { id: "dinner",   label: "Spise aftensmad", arasaacId: 7680,  emoji: "🍽️" },
  { id: "play",     label: "Lege",            arasaacId: 7969,  emoji: "🧸" },
  { id: "toilet",   label: "Tisse af",        arasaacId: 14264, emoji: "🚽" },
  { id: "pajamas",  label: "Nattøj på",       arasaacId: 6600,  emoji: "👕" },
  { id: "teeth",    label: "Børste tænder",   arasaacId: 2087,  emoji: "🪥" },
  { id: "book",     label: "Læse bog",        arasaacId: 3131,  emoji: "📖" },
  { id: "sleep",    label: "Sove",            arasaacId: 2525,  emoji: "😴" },
];

export function pictogramUrl(arasaacId: number): string {
  return `https://static.arasaac.org/pictograms/${arasaacId}/${arasaacId}_300.png`;
}
