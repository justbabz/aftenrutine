import { useState } from "react";

const EXPECTED_HASH = (import.meta.env.VITE_GLOBAL_ADMIN_PASSWORD_HASH ?? "").toLowerCase();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

export function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const configured = EXPECTED_HASH.length === 64;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured || busy) return;
    setBusy(true);
    setError(null);
    try {
      const hash = await sha256Hex(password);
      if (hash === EXPECTED_HASH) {
        onUnlock();
      } else {
        setError("Forkert kode");
        setPassword("");
      }
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

        {!configured && (
          <div className="bg-bad-soft text-bad-500 rounded-2xl p-3 text-sm">
            VITE_GLOBAL_ADMIN_PASSWORD_HASH er ikke sat. Tilføj en SHA-256-hash af dit password i .env.
          </div>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700 px-1">Adgangskode</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            disabled={!configured || busy}
            className="bg-cream-100 border-2 border-ink-100 focus:border-brand-400 outline-none rounded-2xl px-4 py-3 text-ink-900 font-semibold transition-colors disabled:opacity-50"
          />
        </label>

        {error && <div className="text-bad-500 text-sm text-center">{error}</div>}

        <button
          type="submit"
          disabled={!configured || busy || !password}
          className="bg-brand-600 text-white font-bold py-4 rounded-2xl shadow-lift active:scale-95 transition-transform disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none"
        >
          {busy ? "Tjekker…" : "Lås op"}
        </button>
      </form>
    </div>
  );
}
