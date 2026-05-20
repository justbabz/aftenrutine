import { useState } from "react";
import { useApp } from "../state/AppContext";
import { formatFamilyId, normalizeFamilyId } from "../sync/cloud";

function defaultDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPad/.test(ua)) return "iPad";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  return "Enhed";
}

type Stage = "menu" | "new" | "join";

export function CloudSyncPanel({ onClose }: { onClose: () => void }) {
  const { sync, cloudAvailable, enableSyncWithNew, enableSyncWithExisting, disableSync, pushToast } = useApp();
  const [stage, setStage] = useState<Stage>("menu");
  const [deviceName, setDeviceName] = useState(defaultDeviceName());
  const [joinInput, setJoinInput] = useState("");
  const [joinMode, setJoinMode] = useState<"replace-local" | "push-local">("replace-local");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cloudAvailable) {
    return (
      <div className="bg-white rounded-3xl shadow-soft p-5 flex flex-col gap-3">
        <div className="font-bold text-ink-900">Sky-sync er ikke slået til</div>
        <p className="text-ink-500 text-sm">
          Appen er ikke konfigureret med en sky-tjeneste endnu. Bed udvikleren konfigurere Supabase-credentials.
        </p>
        <button onClick={onClose} className="bg-ink-100 text-ink-700 font-bold py-3 rounded-2xl active:scale-95 transition-transform">
          Luk
        </button>
      </div>
    );
  }

  const handleNew = async () => {
    setBusy(true);
    setError(null);
    try {
      await enableSyncWithNew(deviceName.trim() || "Enhed");
      pushToast("Sky-sync slået til");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke oprette familie");
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    const id = normalizeFamilyId(joinInput);
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await enableSyncWithExisting(id, deviceName.trim() || "Enhed", joinMode);
      pushToast("Sky-sync slået til");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke tilslutte familie");
    } finally {
      setBusy(false);
    }
  };

  // ---- Already connected ----
  if (sync.kind !== "off") {
    const isError = sync.kind === "error";
    const isSyncing = sync.kind === "syncing";
    return (
      <div className="bg-white rounded-3xl shadow-soft p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isError ? "bg-bad-soft" : "bg-good-soft"}`}>
            <span className="text-xl">{isError ? "⚠️" : isSyncing ? "↻" : "✓"}</span>
          </div>
          <div className="flex-1">
            <div className="font-bold text-ink-900">{isError ? "Sync-fejl" : isSyncing ? "Synkroniserer..." : "Sky-sync aktiv"}</div>
            <div className="text-xs text-ink-500">Denne enhed: {sync.deviceName}</div>
          </div>
        </div>

        <div className="bg-cream-100 rounded-2xl p-4 flex flex-col gap-2">
          <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Familie-kode</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-base font-bold text-ink-900 break-all select-all">{formatFamilyId(sync.familyId)}</code>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(sync.familyId);
                  pushToast("Kode kopieret");
                } catch { pushToast("Kunne ikke kopiere"); }
              }}
              className="bg-brand-600 text-white font-bold text-sm px-3 py-2 rounded-xl active:scale-95"
            >
              Kopier
            </button>
          </div>
          <div className="text-xs text-ink-500">Del med din makker for at synkronisere. Den der har koden kan redigere familiens rutiner.</div>
        </div>

        {isError && (
          <div className="bg-bad-soft text-bad-500 text-sm font-semibold px-4 py-2 rounded-2xl">{sync.message}</div>
        )}

        <button
          onClick={() => {
            disableSync();
            pushToast("Sky-sync slået fra");
            onClose();
          }}
          className="w-full bg-bad-soft text-bad-500 font-bold py-3 rounded-2xl active:scale-95 transition-transform"
        >
          Frakobl denne enhed
        </button>
        <button
          onClick={onClose}
          className="w-full bg-ink-100 text-ink-700 font-bold py-3 rounded-2xl active:scale-95 transition-transform"
        >
          Luk
        </button>
      </div>
    );
  }

  // ---- Not connected ----
  if (stage === "menu") {
    return (
      <div className="bg-white rounded-3xl shadow-soft p-5 flex flex-col gap-4">
        <div>
          <h3 className="text-xl font-black text-ink-900">Synkroniser mellem enheder</h3>
          <p className="text-ink-500 text-sm mt-1">Del rutiner og piktogrammer mellem dine egne enheder eller med din makker. Hver familie får sin egen kode — du ser kun din egen families data.</p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-700">Navn på denne enhed</span>
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            maxLength={20}
            className="bg-cream-100 border-2 border-transparent focus:border-brand-400 outline-none rounded-2xl px-4 py-3 text-base font-semibold text-ink-900 transition-colors"
          />
        </label>

        <button
          onClick={() => setStage("new")}
          className="bg-brand-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform shadow-soft"
        >
          🆕 Start ny familie
        </button>
        <button
          onClick={() => setStage("join")}
          className="bg-white border-2 border-ink-200 text-ink-700 font-bold py-4 rounded-2xl active:scale-95 transition-transform"
        >
          👥 Tilslut eksisterende familie
        </button>
        <button onClick={onClose} className="text-ink-500 text-sm underline underline-offset-4 mt-1">Luk</button>
      </div>
    );
  }

  if (stage === "new") {
    return (
      <div className="bg-white rounded-3xl shadow-soft p-5 flex flex-col gap-4">
        <div>
          <h3 className="text-xl font-black text-ink-900">Start ny familie</h3>
          <p className="text-ink-500 text-sm mt-1">
            Vi laver en helt ny kode til din husstand. Dine nuværende profiler og rutiner sendes til skyen og kan tilgås fra andre enheder med den samme kode.
          </p>
        </div>
        {error && <div className="bg-bad-soft text-bad-500 text-sm font-semibold px-4 py-2 rounded-2xl">{error}</div>}
        <div className="flex gap-2">
          <button onClick={() => setStage("menu")} className="flex-1 bg-ink-100 text-ink-700 font-bold py-3 rounded-2xl active:scale-95 transition-transform">Tilbage</button>
          <button onClick={handleNew} disabled={busy} className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform disabled:bg-ink-200">
            {busy ? "Opretter..." : "Opret"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-black text-ink-900">Tilslut eksisterende familie</h3>
        <p className="text-ink-500 text-sm mt-1">Indtast koden du har fået fra din makker.</p>
      </div>

      <input
        type="text"
        value={joinInput}
        onChange={(e) => setJoinInput(e.target.value)}
        placeholder="Familie-kode (fx K3PR-9XAM-7BQ2)"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        className="bg-cream-100 border-2 border-transparent focus:border-brand-400 outline-none rounded-2xl px-4 py-3 text-base font-mono font-bold text-ink-900 placeholder:text-ink-300 transition-colors uppercase"
      />

      <div className="bg-warn-soft rounded-2xl p-4 flex flex-col gap-2">
        <div className="text-sm font-bold text-ink-900">Hvad skal der ske med dine nuværende profiler?</div>
        <label className="flex items-start gap-2">
          <input type="radio" name="join-mode" checked={joinMode === "replace-local"} onChange={() => setJoinMode("replace-local")} className="mt-1" />
          <span className="text-sm text-ink-700">Erstat med familiens data fra skyen (mine lokale profiler slettes)</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="radio" name="join-mode" checked={joinMode === "push-local"} onChange={() => setJoinMode("push-local")} className="mt-1" />
          <span className="text-sm text-ink-700">Overskriv familiens data med mine lokale profiler</span>
        </label>
      </div>

      {error && <div className="bg-bad-soft text-bad-500 text-sm font-semibold px-4 py-2 rounded-2xl">{error}</div>}

      <div className="flex gap-2">
        <button onClick={() => setStage("menu")} className="flex-1 bg-ink-100 text-ink-700 font-bold py-3 rounded-2xl active:scale-95 transition-transform">Tilbage</button>
        <button onClick={handleJoin} disabled={busy || !normalizeFamilyId(joinInput)} className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform disabled:bg-ink-200 disabled:text-ink-400">
          {busy ? "Tilslutter..." : "Tilslut"}
        </button>
      </div>
    </div>
  );
}
