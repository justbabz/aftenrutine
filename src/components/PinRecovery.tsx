import { useMemo, useState } from "react";
import { useApp } from "../state/AppContext";
import { PinSetup } from "./PinSetup";

interface Challenge {
  question: string;
  answer: number;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateChallenge(): Challenge {
  const kind = rand(0, 3);
  switch (kind) {
    case 0: {
      const a = rand(12, 19);
      const b = rand(6, 9);
      return { question: `Hvad er ${a} × ${b}?`, answer: a * b };
    }
    case 1: {
      const a = rand(120, 280);
      const b = rand(140, 320);
      return { question: `Hvad er ${a} + ${b}?`, answer: a + b };
    }
    case 2: {
      const b = rand(4, 9);
      const r = rand(11, 19);
      return { question: `Hvad er ${b * r} ÷ ${b}?`, answer: r };
    }
    default: {
      const a = rand(140, 280);
      const b = rand(35, 95);
      return { question: `Hvad er ${a} − ${b}?`, answer: a - b };
    }
  }
}

interface PinRecoveryProps {
  onCancel: () => void;
  onDone: () => void;
}

export function PinRecovery({ onCancel, onDone }: PinRecoveryProps) {
  const { setPin, unlockAdmin, pushToast } = useApp();
  const [challenge, setChallenge] = useState<Challenge>(() => generateChallenge());
  const [input, setInput] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const submit = () => {
    const n = parseInt(input.trim(), 10);
    if (!Number.isFinite(n)) {
      setError("Indtast et tal");
      return;
    }
    if (n === challenge.answer) {
      setVerified(true);
      setError(null);
      return;
    }
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (nextAttempts >= 3) {
      setError("Forkert. Her er et nyt regnestykke.");
      setChallenge(generateChallenge());
      setAttempts(0);
    } else {
      setError(`Forkert svar. Prøv igen (${nextAttempts}/3)`);
    }
    setInput("");
  };

  const hint = useMemo(() => {
    if (!error) return null;
    return error;
  }, [error]);

  if (verified) {
    return (
      <div className="bg-white rounded-3xl shadow-soft p-5 flex flex-col gap-4 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-good-soft flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-good-600" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div className="font-bold text-ink-900">Bekræftet</div>
            <div className="text-xs text-ink-500">Vælg en ny forælder-kode</div>
          </div>
        </div>
        <PinSetup
          title="Vælg ny kode"
          onConfirmed={async (pin) => {
            await setPin(pin);
            unlockAdmin();
            pushToast("Ny kode gemt");
            onDone();
          }}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft p-5 flex flex-col gap-4 animate-fade-up">
      <div>
        <h3 className="text-lg font-bold text-ink-900">Bevis du er voksen</h3>
        <p className="text-sm text-ink-500 mt-1">Løs regnestykket for at lave en ny kode.</p>
      </div>

      <div className="bg-cream-100 rounded-2xl p-5 text-center">
        <div className="text-2xl font-black text-ink-900">{challenge.question}</div>
      </div>

      <input
        type="text"
        inputMode="numeric"
        pattern="\d*"
        value={input}
        onChange={(e) => setInput(e.target.value.replace(/[^\d-]/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder="Dit svar"
        autoFocus
        className="bg-cream-50 border-2 border-ink-100 focus:border-brand-400 outline-none rounded-2xl px-5 py-4 text-2xl font-black text-ink-900 placeholder:text-ink-300 text-center transition-colors"
      />

      {hint && <div className="text-bad-500 text-sm font-semibold text-center">{hint}</div>}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 bg-ink-100 text-ink-700 font-bold py-3 rounded-2xl active:scale-95 transition-transform"
        >
          Fortryd
        </button>
        <button
          onClick={submit}
          disabled={!input.trim()}
          className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform disabled:bg-ink-200 disabled:text-ink-400"
        >
          Svar
        </button>
      </div>

      <button
        onClick={() => { setChallenge(generateChallenge()); setInput(""); setError(null); }}
        className="text-ink-400 text-xs underline underline-offset-4 active:text-ink-700"
      >
        Skift regnestykke
      </button>
    </div>
  );
}
