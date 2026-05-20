import { useState } from "react";
import { useApp } from "../state/AppContext";
import { Profile, ProfileColor, weekdayFromDate } from "../data/types";
import { themeFor } from "../styles/theme";
import { AvatarPicker } from "./AvatarPicker";
import { ColorPicker } from "./ColorPicker";

interface ProfileEditorProps {
  profileId: string;
}

export function ProfileEditor({ profileId }: ProfileEditorProps) {
  const { profile, updateProfile, deleteProfile, goBack, goto, pushToast } = useApp();
  const p = profile(profileId);
  const [draftName, setDraftName] = useState(p?.name ?? "");
  const [showDelete, setShowDelete] = useState(false);

  if (!p) {
    return (
      <div className="min-h-dvh bg-cream-50 flex flex-col items-center justify-center p-6 gap-3">
        <p className="text-ink-700">Profilen findes ikke længere.</p>
        <button onClick={goBack} className="bg-brand-600 text-white px-5 py-3 rounded-2xl font-bold">Tilbage</button>
      </div>
    );
  }

  const t = themeFor(p.color);

  const saveName = () => {
    const next = draftName.trim();
    if (!next || next === p.name) return;
    updateProfile({ ...p, name: next });
    pushToast("Navn gemt");
  };

  const setAvatar = (emoji: string) => {
    updateProfile({ ...p, avatar: { ...p.avatar, emoji } });
  };

  const setColor = (color: ProfileColor) => {
    updateProfile({ ...p, color });
  };

  const handleDelete = () => {
    const snapshot: Profile = JSON.parse(JSON.stringify(p));
    deleteProfile(p.id);
    goBack();
    pushToast(`${snapshot.name} blev slettet`, () => {
      updateProfile(snapshot);
    });
  };

  return (
    <div className="min-h-dvh bg-cream-50 flex flex-col pt-safe pb-safe">
      <header className="px-5 pt-4 pb-3 flex items-center gap-3">
        <button onClick={goBack} aria-label="Tilbage" className="w-12 h-12 rounded-full bg-white shadow-soft flex items-center justify-center active:scale-95">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-ink-700" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="text-2xl font-black text-ink-900 truncate flex-1">{p.name}</h1>
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-2xl shadow-inner`} aria-hidden>
          {p.avatar.emoji}
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 flex flex-col gap-6 max-w-md mx-auto w-full">
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-ink-700 px-1">Rutiner</h2>
          <RoutineRow
            label="Morgen-rutine"
            icon="🌅"
            weeklyCount={Object.values(p.routines.morning).reduce((sum, r) => sum + r.tasks.length, 0)}
            onOpen={() => goto({ kind: "admin-routine", profileId: p.id, slot: "morning", weekday: weekdayFromDate() })}
          />
          <RoutineRow
            label="Aften-rutine"
            icon="🌙"
            weeklyCount={Object.values(p.routines.evening).reduce((sum, r) => sum + r.tasks.length, 0)}
            onOpen={() => goto({ kind: "admin-routine", profileId: p.id, slot: "evening", weekday: weekdayFromDate() })}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-ink-700 px-1">Detaljer</h2>
          <label className="flex flex-col gap-2 bg-white rounded-3xl shadow-soft p-4">
            <span className="text-sm font-semibold text-ink-700">Navn</span>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={saveName}
              maxLength={20}
              className="bg-cream-100 border-2 border-transparent focus:border-brand-400 outline-none rounded-2xl px-4 py-3 text-lg font-semibold text-ink-900 transition-colors"
            />
          </label>

          <div className="bg-white rounded-3xl shadow-soft p-4 flex flex-col gap-3">
            <span className="text-sm font-semibold text-ink-700">Figur</span>
            <AvatarPicker value={p.avatar.emoji} onChange={setAvatar} />
          </div>

          <div className="bg-white rounded-3xl shadow-soft p-4 flex flex-col gap-3">
            <span className="text-sm font-semibold text-ink-700">Farve</span>
            <ColorPicker value={p.color} onChange={setColor} />
          </div>
        </section>

        <section className="pt-2">
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="w-full bg-bad-soft text-bad-500 font-bold py-4 rounded-3xl active:scale-[0.98] transition-transform"
            >
              Slet barn
            </button>
          ) : (
            <div className="bg-white rounded-3xl shadow-soft p-5 flex flex-col gap-3 animate-fade-up">
              <p className="text-ink-700">Slet <span className="font-bold">{p.name}</span> og alle rutiner? Du kan fortryde med det samme.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDelete(false)}
                  className="flex-1 bg-ink-100 text-ink-700 font-bold py-3 rounded-2xl active:scale-95 transition-transform"
                >
                  Behold
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-bad-500 text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform"
                >
                  Slet
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function RoutineRow({ label, icon, weeklyCount, onOpen }: { label: string; icon: string; weeklyCount: number; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="bg-white rounded-3xl shadow-soft p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
    >
      <div className="w-12 h-12 rounded-2xl bg-cream-100 flex items-center justify-center text-2xl" aria-hidden>{icon}</div>
      <div className="flex-1">
        <div className="text-base font-bold text-ink-900">{label}</div>
        <div className="text-sm text-ink-500">{weeklyCount} opgaver i alt på ugen</div>
      </div>
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  );
}
