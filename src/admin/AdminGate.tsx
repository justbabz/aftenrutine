import { useState } from "react";
import { adminConfigured, AdminAuthError, storePassword, verifyPassword } from "./adminCloud";

export function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError(null);
    try {
      await verifyPassword(password);
      storePassword(password);
      onUnlock();
    } catch (e) {
      if (e instanceof AdminAuthError) {
        setError("Forkert kode");
      } else {
        setError(e instanceof Error ? e.message : "Ukendt fejl");
      }
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-cream-50 flex items-center justify-center px-5">
      <form onSubmit={submit} className="bg-white rounded-3xl shadow-soft p-8 w-full max-w-sm flex flex-col gap-5">
        <header className="text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-black text-ink-900">Global admin</h1>
          <p className="text-sm text-ink-500 mt-1">Kun for ejeren af appen</p>
        </header>

        {!adminConfigured && (
          <div className="bg-bad-soft text-bad-500 rounded-2xl p-3 text-sm">
            VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY mangler.
          </div>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700 px-1">Adgangskode</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            disabled={!adminConfigured || busy}
            className="bg-cream-100 border-2 border-ink-100 focus:border-brand-400 outline-none rounded-2xl px-4 py-3 text-ink-900 font-semibold transition-colors disabled:opacity-50"
          />
        </label>

        {error && <div className="text-bad-500 text-sm text-center">{error}</div>}

        <button
          type="submit"
          disabled={!adminConfigured || busy || !password}
          className="bg-brand-600 text-white font-bold py-4 rounded-2xl shadow-lift active:scale-95 transition-transform disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none"
        >
          {busy ? "Tjekker…" : "Lås op"}
        </button>
      </form>
    </div>
  );
}
