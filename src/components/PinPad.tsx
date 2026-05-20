import { useState } from "react";

interface PinPadProps {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (pin: string) => void;
  length?: number;
  reveal?: boolean;
  shake?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", null, "0", "back"] as const;

function vibrate(ms: number) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
}

export function PinPad({ value, onChange, onComplete, length = 4, reveal = false, shake = false }: PinPadProps) {
  const [show, setShow] = useState(reveal);

  const press = (digit: string) => {
    if (value.length >= length) return;
    const next = value + digit;
    vibrate(8);
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const back = () => {
    if (!value) return;
    vibrate(6);
    onChange(value.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto">
      <div className={`flex items-center gap-4 ${shake ? "animate-[wiggle_0.4s_ease-in-out]" : ""}`}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          const digit = value[i];
          return (
            <div
              key={i}
              className={`w-14 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold transition-all duration-200
                ${filled ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-transparent"}`}
            >
              {show && filled ? digit : filled ? "•" : ""}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Skjul kode" : "Vis kode"}
          className="ml-2 w-12 h-12 rounded-full flex items-center justify-center text-ink-500 active:bg-ink-100 transition-colors"
        >
          {show ? (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.77 19.77 0 0 1 4.22-5.16"/><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a19.77 19.77 0 0 1-3.36 4.49"/><path d="M14.12 14.12 9.88 9.88"/><path d="M1 1l22 22"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {KEYS.map((k, i) => {
          if (k === null) return <div key={i} />;
          if (k === "back") {
            return (
              <button
                key={i}
                type="button"
                onClick={back}
                aria-label="Slet"
                className="h-20 rounded-3xl bg-cream-100 text-ink-700 text-lg font-semibold flex items-center justify-center active:scale-95 transition-transform active:bg-cream-200"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
              </button>
            );
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => press(k)}
              className="h-20 rounded-3xl bg-white text-ink-900 text-3xl font-bold shadow-soft active:scale-95 active:shadow-none transition-all duration-150"
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}
