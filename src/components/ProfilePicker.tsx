import { useApp } from "../state/AppContext";
import { defaultSlotForNow, themeFor } from "../styles/theme";
import { Profile } from "../data/types";

export function ProfilePicker() {
  const { config, goto } = useApp();
  const profiles = config.profiles;

  return (
    <div className="min-h-dvh bg-cream-50 flex flex-col pt-safe pb-safe">
      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8 w-full">
        <div className="text-center">
          <h1 className="text-4xl font-black text-ink-900 leading-tight">Hvem er du?</h1>
          <p className="text-ink-500 text-base mt-1">Vælg dig selv for at se din rutine</p>
        </div>

        {profiles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl">
            {profiles.map((p) => (
              <ProfileCard key={p.id} profile={p} onPick={() => goto({ kind: "routine", profileId: p.id, slot: defaultSlotForNow() })} />
            ))}
          </div>
        )}
      </main>

      <footer className="px-6 pb-6 flex items-center justify-center">
        <button
          onClick={() => goto({ kind: "admin-auth" })}
          aria-label="Forælder-indstillinger"
          className="w-14 h-14 rounded-full bg-white shadow-soft flex items-center justify-center active:scale-95 transition-transform text-ink-500"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </footer>
    </div>
  );
}

function ProfileCard({ profile, onPick }: { profile: Profile; onPick: () => void }) {
  const t = themeFor(profile.color);
  return (
    <button
      onClick={onPick}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${t.gradient} ${t.shadow}
        w-44 sm:w-52 aspect-[3/4] flex flex-col items-center justify-center gap-3 text-white
        active:scale-95 transition-transform duration-150`}
    >
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/15" aria-hidden />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/10" aria-hidden />
      <div className="relative text-8xl sm:text-9xl drop-shadow-sm leading-none" aria-hidden>{profile.avatar.emoji}</div>
      <div className="relative text-2xl sm:text-3xl font-black leading-tight drop-shadow-sm text-center px-2">
        {profile.name}
      </div>
    </button>
  );
}

function EmptyState() {
  const { goto } = useApp();
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 max-w-xs">
      <div className="text-7xl">👶</div>
      <h2 className="text-2xl font-bold text-ink-900">Ingen børn endnu</h2>
      <p className="text-ink-500">Åbn forælder-indstillinger for at tilføje et barn.</p>
      <button
        onClick={() => goto({ kind: "admin-auth" })}
        className="mt-2 bg-brand-600 text-white text-base font-bold px-6 py-3 rounded-2xl shadow-soft active:scale-95 transition-transform"
      >
        Forælder-indstillinger
      </button>
    </div>
  );
}
