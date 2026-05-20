import { AppProvider, useApp } from "./state/AppContext";
import { SetupWizard } from "./components/SetupWizard";
import { AdminAuth } from "./components/AdminAuth";

function Placeholder({ title }: { title: string }) {
  const { goBack } = useApp();
  return (
    <div className="min-h-dvh bg-cream-50 flex flex-col items-center justify-center p-6 gap-4 pt-safe pb-safe">
      <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
      <p className="text-ink-500 text-sm">Skærm under opbygning</p>
      <button
        onClick={goBack}
        className="bg-brand-600 text-white px-6 py-3 rounded-2xl font-bold shadow-soft active:scale-95 transition-transform"
      >
        Tilbage
      </button>
    </div>
  );
}

function Router() {
  const { screen } = useApp();
  switch (screen.kind) {
    case "setup-wizard":
      return <SetupWizard />;
    case "admin-auth":
      return <AdminAuth />;
    case "picker":
      return <Placeholder title="Profilvælger" />;
    case "routine":
      return <Placeholder title={`Rutine: ${screen.slot}`} />;
    case "admin-home":
      return <Placeholder title="Admin" />;
    case "admin-profile":
      return <Placeholder title="Rediger barn" />;
    case "admin-routine":
      return <Placeholder title="Rediger rutine" />;
    case "admin-task":
      return <Placeholder title="Rediger opgave" />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
