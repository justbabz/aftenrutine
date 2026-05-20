import { useState } from "react";
import { useApp } from "../state/AppContext";
import { ProfileColor } from "../data/types";
import { PinSetup } from "./PinSetup";
import { AvatarPicker, AVATAR_EMOJIS } from "./AvatarPicker";
import { ColorPicker } from "./ColorPicker";
import { defaultDeviceName, normalizeFamilyId } from "../sync/cloud";

type Stage = "welcome" | "choose" | "join" | "pin" | "child";

export function SetupWizard() {
  const { setPin, addProfile, replaceScreen, cloudAvailable, enableSyncWithExisting, pushToast } = useApp();
  const [stage, setStage] = useState<Stage>("welcome");

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATAR_EMOJIS[0]);
  const [color, setColor] = useState<ProfileColor>("lilac");

  const [joinCode, setJoinCode] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handlePinDone = async (pin: string) => {
    await setPin(pin);
    setStage("child");
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    addProfile({ name: name.trim(), avatar: { arasaacId: null, emoji: avatar }, color });
    replaceScreen({ kind: "picker" });
  };

  const handleStart = () => {
    if (cloudAvailable) setStage("choose");
    else setStage("pin");
  };

  const handleJoin = async () => {
    const code = normalizeFamilyId(joinCode);
    if (!code) return;
    setJoinBusy(true);
    setJoinError(null);
    try {
      await enableSyncWithExisting(code, defaultDeviceName(), "replace-local");
      pushToast("Tilsluttet familie");
      replaceScreen({ kind: "picker" });
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Kunne ikke tilslutte. Tjek koden.");
    } finally {
      setJoinBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-cream-50 to-cream-100 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-safe pb-safe py-10 w-full max-w-md mx-auto">
        {stage === "welcome" && (
          <div className="flex flex-col items-center text-center gap-6 animate-fade-up">
            <div className="text-7xl animate-bounce2">🌙</div>
            <h1 className="text-4xl font-black text-ink-900 leading-tight">Velkommen til Familierutine</h1>
            <p className="text-ink-500 text-lg max-w-xs">
              En blid hjælper til morgen- og aftenrutiner. Lad os sætte det op sammen.
            </p>
            <button
              onClick={handleStart}
              className="mt-4 bg-brand-600 text-white text-lg font-bold px-10 py-5 rounded-3xl shadow-lift active:scale-95 transition-transform"
            >
              Kom i gang
            </button>
          </div>
        )}

        {stage === "choose" && (
          <div className="flex flex-col items-center text-center gap-6 animate-fade-up w-full">
            <div className="text-6xl">👋</div>
            <div>
              <h1 className="text-3xl font-black text-ink-900 leading-tight">Er det første gang?</h1>
              <p className="text-ink-500 text-base mt-2 max-w-xs mx-auto">
                Hvis din makker allerede har oprettet familien, kan du tilslutte dig med en familie-kode.
              </p>
            </div>
            <div className="w-full flex flex-col gap-3 mt-2">
              <button
                onClick={() => setStage("pin")}
                className="bg-brand-600 text-white text-lg font-bold py-5 rounded-3xl shadow-lift active:scale-95 transition-transform"
              >
                🆕 Opsæt ny familie
              </button>
              <button
                onClick={() => setStage("join")}
                className="bg-white border-2 border-ink-200 text-ink-900 text-lg font-bold py-5 rounded-3xl active:scale-95 transition-transform"
              >
                👥 Tilslut eksisterende familie
              </button>
            </div>
            <button
              onClick={() => setStage("welcome")}
              className="text-ink-400 text-sm underline underline-offset-4 active:text-ink-700"
            >
              Tilbage
            </button>
          </div>
        )}

        {stage === "join" && (
          <div className="flex flex-col gap-5 animate-fade-up w-full">
            <div className="text-center">
              <div className="text-5xl mb-2">🔑</div>
              <h2 className="text-3xl font-black text-ink-900">Indtast familie-kode</h2>
              <p className="text-ink-500 text-base mt-2">Din makker kan finde koden under Forælder-indstillinger → Sky-sync.</p>
            </div>

            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Familie-kode (fx K3PR-9XAM-7BQ2)"
              autoFocus
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="bg-white border-2 border-ink-100 focus:border-brand-400 outline-none rounded-2xl px-5 py-4 text-lg font-mono font-bold text-ink-900 placeholder:text-ink-300 shadow-soft transition-colors uppercase text-center"
            />

            {joinError && (
              <div className="bg-bad-soft text-bad-500 text-sm font-semibold px-4 py-3 rounded-2xl text-center">{joinError}</div>
            )}

            <button
              onClick={handleJoin}
              disabled={joinBusy || !normalizeFamilyId(joinCode)}
              className="bg-brand-600 text-white text-lg font-bold py-5 rounded-3xl shadow-lift active:scale-95 transition-transform disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none"
            >
              {joinBusy ? "Tilslutter..." : "Tilslut"}
            </button>

            <button
              onClick={() => { setStage("choose"); setJoinCode(""); setJoinError(null); }}
              className="text-ink-500 underline underline-offset-4 active:text-ink-900 text-sm"
            >
              Tilbage
            </button>
          </div>
        )}

        {stage === "pin" && (
          <div className="w-full animate-fade-up">
            <PinSetup onConfirmed={handlePinDone} title="Lav en forælder-kode" />
          </div>
        )}

        {stage === "child" && (
          <div className="w-full flex flex-col gap-6 animate-fade-up">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-ink-900 mb-2">Tilføj dit første barn</h2>
              <p className="text-ink-500 text-base">Du kan tilføje flere bagefter.</p>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink-700 px-1">Navn</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fx Emma"
                autoFocus
                maxLength={20}
                className="bg-white border-2 border-ink-100 focus:border-brand-400 outline-none rounded-2xl px-5 py-4 text-xl font-semibold text-ink-900 placeholder:text-ink-300 shadow-soft transition-colors"
              />
            </label>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-ink-700 px-1">Vælg en figur</span>
              <AvatarPicker value={avatar} onChange={setAvatar} />
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-ink-700 px-1">Yndlingsfarve</span>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="mt-2 bg-brand-600 text-white text-lg font-bold px-10 py-5 rounded-3xl shadow-lift active:scale-95 transition-transform disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none"
            >
              Fortsæt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
