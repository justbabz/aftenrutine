import { useChecklist } from "./hooks/useChecklist";
import { ChecklistGrid } from "./components/ChecklistGrid";
import { CelebrationOverlay } from "./components/CelebrationOverlay";

export default function App() {
  const { checked, toggle, reset, allDone } = useChecklist();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="bg-purple-600 text-white py-4 px-5 flex items-center justify-between shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">🌙 Aftenrutine</h1>
        <button
          onClick={reset}
          className="text-purple-200 text-sm underline underline-offset-2 active:text-white"
          aria-label="Nulstil tjeklisten"
        >
          Nulstil
        </button>
      </header>

      {/* Indhold */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        <ChecklistGrid checked={checked} onToggle={toggle} />
      </main>

      {allDone && <CelebrationOverlay onReset={reset} />}
    </div>
  );
}
