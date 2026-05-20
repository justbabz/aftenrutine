import { useState } from "react";
import { useApp } from "../state/AppContext";
import { Profile, ProfileColor } from "../data/types";
import { themeFor } from "../styles/theme";
import { AvatarPicker, AVATAR_EMOJIS } from "./AvatarPicker";
import { ColorPicker } from "./ColorPicker";
import { PinSetup } from "./PinSetup";
import { CloudSyncPanel } from "./CloudSyncPanel";

export function AdminScreen() {
  const { config, goto, lockAdmin, addProfile, pushToast } = useApp();
  const [adding, setAdding] = useState(false);

  if (adding) return <AddProfileFlow onDone={() => setAdding(false)} addProfile={addProfile} goto={goto} />;

  return (
    <div className="min-h-dvh bg-cream-50 flex flex-col pt-safe pb-safe">
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 w-full">
        <div className="flex flex-col gap-6 max-w-md w-full">
          <header className="text-center">
            <h1 className="text-3xl font-black text-ink-900 leading-tight">Forælder-indstillinger</h1>
            <p className="text-ink-500 text-sm mt-1">Tilføj børn og rediger deres rutiner</p>
          </header>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-ink-700 px-1">Børn</h2>
            {config.profiles.length === 0 && (
              <div className="bg-white rounded-3xl shadow-soft p-6 text-center">
                <div className="text-4xl mb-2">👶</div>
                <p className="text-ink-500 mb-3">Ingen børn endnu</p>
              </div>
            )}
            {config.profiles.map((p) => (
              <ProfileRow key={p.id} profile={p} onEdit={() => goto({ kind: "admin-profile", profileId: p.id })} />
            ))}
            {config.profiles.length < 6 && (
              <button
                onClick={() => setAdding(true)}
                className="bg-white border-2 border-dashed border-ink-200 text-ink-700 rounded-3xl py-5 px-5 font-bold text-base active:bg-cream-100 transition-colors"
              >
                + Tilføj barn
              </button>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-ink-700 px-1">App</h2>
            <CloudSyncRow />
            <ChangePinRow />
            <DangerZone />
          </section>

          <button
            onClick={() => { lockAdmin(); pushToast("Forælder-mode låst"); }}
            className="mt-4 bg-ink-900 text-white font-bold text-base py-4 rounded-3xl shadow-soft active:scale-95 transition-transform flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Lås og luk forælder-mode
          </button>
        </div>
      </main>
    </div>
  );
}

function CloudSyncRow() {
  const { sync, cloudAvailable } = useApp();
  const [open, setOpen] = useState(false);

  if (open) return <CloudSyncPanel onClose={() => setOpen(false)} />;

  const status = sync.kind === "off" ? "Ikke slået til" :
    sync.kind === "error" ? "Sync-fejl" :
    sync.kind === "syncing" ? "Synkroniserer..." :
    "Aktiv";

  return (
    <button
      onClick={() => setOpen(true)}
      className="bg-white rounded-3xl shadow-soft p-4 flex items-center justify-between text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${sync.kind === "off" ? "bg-ink-100" : sync.kind === "error" ? "bg-bad-soft" : "bg-good-soft"}`} aria-hidden>
          ☁️
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-ink-900">Sky-sync mellem enheder</div>
          <div className="text-xs text-ink-500 truncate">{cloudAvailable ? status : "Ikke konfigureret"}</div>
        </div>
      </div>
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  );
}

function DangerZone() {
  const { resetEverything } = useApp();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-white rounded-3xl shadow-soft p-4 flex items-center justify-between text-left active:scale-[0.98] transition-transform"
      >
        <span className="font-semibold text-ink-700">Nulstil hele appen</span>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft p-5 flex flex-col gap-3 animate-fade-up">
      <p className="text-ink-700 text-sm">
        Sletter alle børn, opgaver og kode. Skriv <span className="font-bold">NULSTIL</span> for at bekræfte.
      </p>
      <input
        type="text"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="NULSTIL"
        className="bg-cream-100 border-2 border-ink-100 focus:border-bad-500 outline-none rounded-2xl px-4 py-3 text-ink-900 placeholder:text-ink-300 font-semibold transition-colors"
      />
      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setConfirm(""); }}
          className="flex-1 bg-ink-100 text-ink-700 font-bold py-3 rounded-2xl active:scale-95 transition-transform"
        >
          Fortryd
        </button>
        <button
          onClick={() => { if (confirm.trim().toUpperCase() === "NULSTIL") resetEverything(); }}
          disabled={confirm.trim().toUpperCase() !== "NULSTIL"}
          className="flex-1 bg-bad-500 text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform disabled:bg-ink-200 disabled:text-ink-400"
        >
          Slet alt
        </button>
      </div>
    </div>
  );
}

function ProfileRow({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  const t = themeFor(profile.color);
  const morningCount = Object.values(profile.routines.morning).reduce((sum, r) => sum + r.tasks.length, 0);
  const eveningCount = Object.values(profile.routines.evening).reduce((sum, r) => sum + r.tasks.length, 0);
  return (
    <button
      onClick={onEdit}
      className="bg-white rounded-3xl shadow-soft p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-4xl shadow-inner`} aria-hidden>
        {profile.avatar.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-lg font-bold text-ink-900 truncate">{profile.name}</div>
        <div className="text-sm text-ink-500">
          🌅 {morningCount} · 🌙 {eveningCount}
        </div>
      </div>
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  );
}

function ChangePinRow() {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="bg-white rounded-3xl shadow-soft p-4 flex items-center justify-between text-left active:scale-[0.98] transition-transform"
      >
        <span className="font-semibold text-ink-900">Skift forælder-kode</span>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    );
  }
  return <ChangePinPanel onClose={() => setEditing(false)} />;
}

function ChangePinPanel({ onClose }: { onClose: () => void }) {
  const { setPin, pushToast } = useApp();
  return (
    <div className="bg-white rounded-3xl shadow-soft p-5 animate-fade-up">
      <PinSetup
        title="Vælg ny kode"
        onConfirmed={async (pin) => {
          await setPin(pin);
          pushToast("Ny kode gemt");
          onClose();
        }}
        onCancel={onClose}
      />
    </div>
  );
}

function AddProfileFlow({
  onDone,
  addProfile,
  goto,
}: {
  onDone: () => void;
  addProfile: ReturnType<typeof useApp>["addProfile"];
  goto: ReturnType<typeof useApp>["goto"];
}) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATAR_EMOJIS[0]);
  const [color, setColor] = useState<ProfileColor>("sky");

  const save = () => {
    if (!name.trim()) return;
    const created = addProfile({ name: name.trim(), avatar: { arasaacId: null, emoji: avatar }, color });
    onDone();
    goto({ kind: "admin-profile", profileId: created.id });
  };

  return (
    <div className="min-h-dvh bg-cream-50 flex flex-col pt-safe pb-safe">
      <header className="px-5 pt-4 pb-3 flex items-center gap-3">
        <button onClick={onDone} aria-label="Tilbage" className="w-12 h-12 rounded-full bg-white shadow-soft flex items-center justify-center active:scale-95">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-ink-700" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="text-2xl font-black text-ink-900">Nyt barn</h1>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 flex flex-col gap-6 max-w-md mx-auto w-full">
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
          onClick={save}
          disabled={!name.trim()}
          className="mt-2 bg-brand-600 text-white text-lg font-bold py-4 rounded-3xl shadow-lift active:scale-95 transition-transform disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none"
        >
          Opret barn
        </button>
      </main>
    </div>
  );
}
