import { AppProvider, useApp } from "./state/AppContext";

function Placeholder({ title }: { title: string }) {
  const { goBack } = useApp();
  return (
    <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center p-6 gap-4">
      <h1 className="text-2xl font-bold text-purple-700">{title}</h1>
      <p className="text-purple-600 text-sm">Skærm under opbygning</p>
      <button
        onClick={goBack}
        className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-semibold"
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
      return <Placeholder title="Velkommen" />;
    case "picker":
      return <Placeholder title="Profilvælger" />;
    case "routine":
      return <Placeholder title={`Rutine: ${screen.slot}`} />;
    case "admin-auth":
      return <Placeholder title="Tast PIN" />;
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
