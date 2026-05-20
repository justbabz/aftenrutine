import { useState } from "react";
import { isTrivialPin } from "../auth";
import { PinPad } from "./PinPad";

interface PinSetupProps {
  onConfirmed: (pin: string) => void;
  onCancel?: () => void;
  title?: string;
}

type Stage = "first" | "confirm";

export function PinSetup({ onConfirmed, onCancel, title = "Vælg en kode" }: PinSetupProps) {
  const [stage, setStage] = useState<Stage>("first");
  const [first, setFirst] = useState("");
  const [value, setValue] = useState("");
  const [warn, setWarn] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const reset = () => {
    setStage("first");
    setFirst("");
    setValue("");
    setWarn(null);
  };

  const handleComplete = (pin: string) => {
    if (stage === "first") {
      if (isTrivialPin(pin)) {
        setWarn("Den kode er for nem at gætte. Prøv en anden.");
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setValue("");
        }, 400);
        return;
      }
      setWarn(null);
      setFirst(pin);
      setValue("");
      setStage("confirm");
      return;
    }
    if (pin === first) {
      onConfirmed(pin);
    } else {
      setWarn("Koderne er ikke ens. Prøv igen.");
      setShake(true);
      setTimeout(() => {
        setShake(false);
        reset();
      }, 600);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-center max-w-xs">
        <h2 className="text-3xl font-bold text-ink-900 mb-2">{title}</h2>
        <p className="text-ink-500 text-base">
          {stage === "first"
            ? "Vælg 4 cifre. Du skal bruge koden når du vil ændre noget i appen."
            : "Tast koden igen for at bekræfte."}
        </p>
      </div>

      <PinPad value={value} onChange={setValue} onComplete={handleComplete} shake={shake} />

      {warn && (
        <div className="bg-warn-soft text-ink-900 px-4 py-2 rounded-2xl text-sm font-semibold animate-fade-up">
          {warn}
        </div>
      )}

      {onCancel && (
        <button
          onClick={onCancel}
          className="text-ink-500 underline underline-offset-4 active:text-ink-900 text-sm"
        >
          Annullér
        </button>
      )}
    </div>
  );
}
