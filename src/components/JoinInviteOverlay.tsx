import { useEffect, useState } from "react";
import { useApp } from "../state/AppContext";
import { defaultDeviceName, formatFamilyId, parseInviteCode } from "../sync/cloud";

export function JoinInviteOverlay() {
  const { sync, cloudAvailable, enableSyncWithExisting, replaceScreen, pushToast } = useApp();
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = () => {
      const parsed = parseInviteCode(window.location.hash);
      if (!parsed) return;
      // Clean the hash so we don't re-trigger on refresh.
      history.replaceState(null, "", window.location.pathname + window.location.search);
      setCode(parsed);
    };
    handle();
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);

  // If we somehow get an invite code while sync is already on the same family, skip.
  useEffect(() => {
    if (!code) return;
    if (sync.kind !== "off" && sync.familyId === code) {
      pushToast("Du er allerede i denne familie");
      setCode(null);
    }
  }, [code, sync, pushToast]);

  if (!code) return null;

  if (!cloudAvailable) {
    return (
      <Modal>
        <div className="bg-white rounded-3xl shadow-lift p-6 w-full max-w-sm flex flex-col gap-4 animate-fade-up">
          <h2 className="text-xl font-black text-ink-900">Sky-sync ikke konfigureret</h2>
          <p className="text-sm text-ink-500">Appen mangler sky-sync-credentials. Be developeren konfigurere Supabase.</p>
          <button onClick={() => setCode(null)} className="bg-ink-100 text-ink-700 font-bold py-3 rounded-2xl">Luk</button>
        </div>
      </Modal>
    );
  }

  const handleJoin = async () => {
    setBusy(true);
    setError(null);
    try {
      await enableSyncWithExisting(code, defaultDeviceName(), "replace-local");
      pushToast("Tilsluttet familie");
      setCode(null);
      replaceScreen({ kind: "picker" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke tilslutte. Tjek netværket og prøv igen.");
    } finally {
      setBusy(false);
    }
  };

  const switching = sync.kind !== "off" && sync.familyId !== code;

  return (
    <Modal>
      <div className="bg-white rounded-3xl shadow-lift p-6 w-full max-w-sm flex flex-col gap-4 animate-fade-up">
        <div className="text-center">
          <div className="text-5xl mb-2">👋</div>
          <h2 className="text-2xl font-black text-ink-900">Tilslut familie?</h2>
          <p className="text-sm text-ink-500 mt-2">Du er blevet inviteret til familien:</p>
          <code className="block mt-2 font-mono text-lg font-bold text-brand-700 bg-brand-50 px-3 py-2 rounded-xl">{formatFamilyId(code)}</code>
        </div>

        <div className="bg-warn-soft rounded-2xl p-3 text-sm text-ink-700">
          {switching
            ? "Du er allerede tilsluttet en anden familie. Skifter du nu, erstattes alle dine nuværende profiler og rutiner."
            : "Dine nuværende profiler og rutiner erstattes med familiens. Hvis du ingen har endnu, mister du intet."}
        </div>

        {error && <div className="bg-bad-soft text-bad-500 text-sm font-semibold px-4 py-2 rounded-2xl text-center">{error}</div>}

        <div className="flex flex-col gap-2">
          <button
            onClick={handleJoin}
            disabled={busy}
            className="bg-brand-600 text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform disabled:bg-ink-200 disabled:text-ink-400"
          >
            {busy ? "Tilslutter..." : "Tilslut familien"}
          </button>
          <button
            onClick={() => setCode(null)}
            disabled={busy}
            className="bg-ink-100 text-ink-700 font-bold py-3 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
          >
            Annullér
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      {children}
    </div>
  );
}
