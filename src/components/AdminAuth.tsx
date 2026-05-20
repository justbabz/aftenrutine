import { useEffect, useState } from "react";
import { useApp } from "../state/AppContext";
import { PinPad } from "./PinPad";
import { PinRecovery } from "./PinRecovery";

export function AdminAuth() {
  const { tryUnlockAdmin, replaceScreen, goBack, config } = useApp();
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(config.lockedUntil);
  const [now, setNow] = useState(() => Date.now());
  const [showRecovery, setShowRecovery] = useState(false);

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

        {!showRecovery ? (
          <button
            onClick={() => setShowRecovery(true)}
            className="text-ink-400 text-sm underline underline-offset-4 mt-2 active:text-ink-700"
          >
            Glemt koden?
          </button>
        ) : (
          <PinRecovery
            onCancel={() => setShowRecovery(false)}
            onDone={() => { setShowRecovery(false); replaceScreen({ kind: "admin-home" }); }}
          />
        )}
      </div>
    </div>
  );
}
