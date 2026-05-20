import { useEffect, useState } from "react";
import { useApp } from "../state/AppContext";
import { PinPad } from "./PinPad";

export function AdminAuth() {
  const { tryUnlockAdmin, replaceScreen, goBack, config, resetEverything } = useApp();
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(config.lockedUntil);
  const [now, setNow] = useState(() => Date.now());
  const [confirmReset, setConfirmReset] = useState("");
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const remainingMs = lockedUntil ? lockedUntil - now : 0;
  const isLocked = remainingMs > 0;

  const handleComplete = async (pin: string) => {
    if (isLocked) return;
    const res = await tryUnlockAdmin(pin);
    if (res.ok) {
      setError(null);
      replaceScreen({ kind: "admin-home" });
      return;
    }
    setShake(true);
    setLockedUntil(res.lockedUntil);
    setError(res.lockedUntil && res.lockedUntil > Date.now() ? "For mange forsøg. Vent lidt." : "Forkert kode");
    setTimeout(() => {
      setShake(false);
      setValue("");
    }, 500);
  };

  const tryReset = () => {
    if (confirmReset.trim().toUpperCase() === "NULSTIL") {
      resetEverything();
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-cream-50 to-cream-100 flex flex-col pt-safe pb-safe">
      <header className="px-5 pt-4 flex items-center">
        <button
          onClick={goBack}
          className="w-12 h-12 rounded-full bg-white shadow-soft flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Tilbage"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-ink-700" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 w-full max-w-md mx-auto">
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-3xl font-bold text-ink-900 mb-1">Forælder-kode</h2>
          <p className="text-ink-500">Tast koden for at åbne administration</p>
        </div>

        <PinPad value={value} onChange={setValue} onComplete={handleComplete} shake={shake} />

        {isLocked && (
          <div className="bg-bad-soft text-ink-900 px-4 py-3 rounded-2xl text-center font-semibold animate-fade-up">
            Låst i {Math.ceil(remainingMs / 1000)} sekunder
          </div>
        )}

        {error && !isLocked && (
          <div className="text-bad-500 font-semibold animate-fade-up">{error}</div>
        )}

        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="text-ink-400 text-sm underline underline-offset-4 mt-2"
          >
            Glemt koden?
          </button>
        ) : (
          <div className="bg-white rounded-3xl shadow-soft p-5 w-full flex flex-col gap-3 animate-fade-up">
            <p className="text-ink-700 text-sm">
              Glemt koden? Du kan nulstille hele appen — alle børn, opgaver og indstillinger slettes.
              Skriv <span className="font-bold">NULSTIL</span> for at bekræfte.
            </p>
            <input
              type="text"
              value={confirmReset}
              onChange={(e) => setConfirmReset(e.target.value)}
              placeholder="NULSTIL"
              className="bg-cream-100 border-2 border-ink-100 focus:border-bad-500 outline-none rounded-2xl px-4 py-3 text-ink-900 placeholder:text-ink-300 font-semibold transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowReset(false); setConfirmReset(""); }}
                className="flex-1 bg-ink-100 text-ink-700 font-bold py-3 rounded-2xl active:scale-95 transition-transform"
              >
                Fortryd
              </button>
              <button
                onClick={tryReset}
                disabled={confirmReset.trim().toUpperCase() !== "NULSTIL"}
                className="flex-1 bg-bad-500 text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform disabled:bg-ink-200 disabled:text-ink-400"
              >
                Nulstil alt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
