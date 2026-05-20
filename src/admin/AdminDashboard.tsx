import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminAuthError,
  AdminFamilyRow,
  adminConfigured,
  clearPassword,
  deleteFamily,
  listAllFamilies,
} from "./adminCloud";
import { formatFamilyId } from "../sync/cloud";
import { Profile } from "../data/types";
import { themeFor } from "../styles/theme";

const REFRESH_INTERVAL_MS = 30_000;

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; rows: AdminFamilyRow[] }
  | { kind: "error"; message: string };

const DAY_MS = 24 * 60 * 60 * 1000;

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (diff < 60_000) return "lige nu";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min siden`;
  if (diff < DAY_MS) return `${Math.floor(diff / 3_600_000)} t siden`;
  const days = Math.floor(diff / DAY_MS);
  if (days < 30) return `${days} d siden`;
  return new Date(iso).toLocaleDateString("da-DK");
}

function fullDate(iso: string | null): string {
  if (!iso) return "ukendt";
  return new Date(iso).toLocaleString("da-DK", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function profileCount(row: AdminFamilyRow): number {
  return row.payload?.profiles?.length ?? 0;
}

function taskCount(row: AdminFamilyRow): number {
  const profiles = row.payload?.profiles ?? [];
  let total = 0;
  for (const p of profiles) {
    for (const slot of ["morning", "evening"] as const) {
      const weekly = p.routines?.[slot];
      if (!weekly) continue;
      for (const day of Object.values(weekly)) {
        total += day?.tasks?.length ?? 0;
      }
    }
  }
  return total;
}

function hasPin(row: AdminFamilyRow): boolean {
  return Boolean(row.payload?.pin);
}

function familyName(row: AdminFamilyRow): string {
  return row.payload?.familyName?.trim() ?? "";
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportJson(rows: AdminFamilyRow[]) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  downloadBlob(`familierutine-${stamp}.json`, JSON.stringify(rows, null, 2), "application/json");
}

function exportCsv(rows: AdminFamilyRow[]) {
  const header = ["id", "family_name", "created_at", "updated_at", "last_device", "profiles", "tasks", "has_pin"];
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      r.id,
      familyName(r),
      r.createdAt ?? "",
      r.updatedAt,
      r.lastDevice ?? "",
      profileCount(r),
      taskCount(r),
      hasPin(r) ? "yes" : "no",
    ].map(escape).join(","));
  }
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  downloadBlob(`familierutine-${stamp}.csv`, lines.join("\n"), "text/csv");
}

export function AdminDashboard({ onLock }: { onLock: () => void }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [query, setQuery] = useState("");
  const [onlyRecent, setOnlyRecent] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!adminConfigured) {
      setState({ kind: "error", message: "Supabase er ikke konfigureret (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY mangler)." });
      return;
    }
    setRefreshing(true);
    try {
      const rows = await listAllFamilies();
      setState({ kind: "ready", rows });
      setLastRefreshed(new Date());
    } catch (e) {
      if (e instanceof AdminAuthError) {
        clearPassword();
        onLock();
        return;
      }
      setState({ kind: "error", message: e instanceof Error ? e.message : "Ukendt fejl" });
    } finally {
      setRefreshing(false);
    }
  }, [onLock]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => { void refresh(); }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const rows = state.kind === "ready" ? state.rows : [];

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    const cutoff = Date.now() - 7 * DAY_MS;
    return rows.filter((r) => {
      if (q) {
        const matchesId = r.id.toUpperCase().includes(q);
        const matchesName = familyName(r).toUpperCase().includes(q);
        if (!matchesId && !matchesName) return false;
      }
      if (onlyRecent && new Date(r.updatedAt).getTime() < cutoff) return false;
      return true;
    });
  }, [rows, query, onlyRecent]);

  const stats = useMemo(() => {
    const now = Date.now();
    const last24h = rows.filter((r) => now - new Date(r.updatedAt).getTime() < DAY_MS).length;
    const last7d = rows.filter((r) => now - new Date(r.updatedAt).getTime() < 7 * DAY_MS).length;
    const created24h = rows.filter((r) => r.createdAt && now - new Date(r.createdAt).getTime() < DAY_MS).length;
    const profiles = rows.reduce((sum, r) => sum + profileCount(r), 0);
    return { total: rows.length, last24h, last7d, created24h, profiles };
  }, [rows]);

  const selected = selectedId ? rows.find((r) => r.id === selectedId) ?? null : null;

  return (
    <div className="min-h-dvh bg-cream-50 pt-safe pb-safe">
      <header className="bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-ink-900">Familierutine · Global admin</h1>
          <p className="text-sm text-ink-500">
            {lastRefreshed
              ? `Opdateret ${lastRefreshed.toLocaleTimeString("da-DK")} · auto hver 30s`
              : "Henter…"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void refresh()}
            disabled={refreshing}
            className="bg-ink-100 text-ink-700 font-bold px-4 py-2 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {refreshing ? "Henter…" : "Opdater"}
          </button>
          <button
            onClick={() => exportJson(rows)}
            disabled={rows.length === 0}
            className="bg-ink-100 text-ink-700 font-bold px-4 py-2 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
          >
            JSON
          </button>
          <button
            onClick={() => exportCsv(rows)}
            disabled={rows.length === 0}
            className="bg-ink-100 text-ink-700 font-bold px-4 py-2 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
          >
            CSV
          </button>
          <button
            onClick={onLock}
            className="bg-ink-900 text-white font-bold px-4 py-2 rounded-2xl active:scale-95 transition-transform"
          >
            Lås
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6 flex flex-col gap-6">
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Familier i alt" value={stats.total} />
          <Stat label="Oprettet seneste 24t" value={stats.created24h} accent="good" />
          <Stat label="Aktive 24t" value={stats.last24h} />
          <Stat label="Aktive 7d" value={stats.last7d} />
          <Stat label="Profiler i alt" value={stats.profiles} />
        </section>

        <section className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søg på navn eller ID…"
            className="flex-1 min-w-[200px] bg-white border-2 border-ink-100 focus:border-brand-400 outline-none rounded-2xl px-4 py-3 text-ink-900 placeholder:text-ink-300 font-semibold transition-colors"
          />
          <label className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 border-2 border-ink-100 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyRecent}
              onChange={(e) => setOnlyRecent(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-semibold text-ink-700">Kun aktive 7d</span>
          </label>
        </section>

        {state.kind === "loading" && (
          <div className="bg-white rounded-3xl shadow-soft p-10 text-center text-ink-500">Henter familier…</div>
        )}

        {state.kind === "error" && (
          <div className="bg-bad-soft text-bad-500 rounded-3xl p-6">
            <div className="font-bold mb-1">Kunne ikke hente data</div>
            <div className="text-sm">{state.message}</div>
          </div>
        )}

        {state.kind === "ready" && filtered.length === 0 && (
          <div className="bg-white rounded-3xl shadow-soft p-10 text-center text-ink-500">
            {rows.length === 0 ? "Ingen familier endnu." : "Ingen resultater."}
          </div>
        )}

        {state.kind === "ready" && filtered.length > 0 && (
          <section className="grid lg:grid-cols-[1fr_400px] gap-4 items-start">
            <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream-100 text-ink-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold">Familie</th>
                    <th className="text-left px-4 py-3 font-bold">Oprettet</th>
                    <th className="text-left px-4 py-3 font-bold">Sidst aktiv</th>
                    <th className="text-left px-4 py-3 font-bold">Enhed</th>
                    <th className="text-right px-4 py-3 font-bold">Profiler</th>
                    <th className="text-right px-4 py-3 font-bold">Tasks</th>
                    <th className="text-center px-4 py-3 font-bold">PIN</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const name = familyName(row);
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        className={`border-t border-ink-100 cursor-pointer hover:bg-cream-50 transition-colors ${selectedId === row.id ? "bg-brand-50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          {name
                            ? <>
                                <div className="font-bold text-ink-900">{name}</div>
                                <div className="font-mono text-xs text-ink-500">{formatFamilyId(row.id)}</div>
                              </>
                            : <span className="font-mono text-ink-900">{formatFamilyId(row.id)}</span>}
                        </td>
                        <td className="px-4 py-3 text-ink-700">{relativeTime(row.createdAt)}</td>
                        <td className="px-4 py-3 text-ink-700">{relativeTime(row.updatedAt)}</td>
                        <td className="px-4 py-3 text-ink-500">{row.lastDevice ?? "—"}</td>
                        <td className="px-4 py-3 text-right text-ink-900 font-bold">{profileCount(row)}</td>
                        <td className="px-4 py-3 text-right text-ink-700">{taskCount(row)}</td>
                        <td className="px-4 py-3 text-center">
                          {hasPin(row) ? <span className="text-good-500">✓</span> : <span className="text-ink-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <aside className="sticky top-4">
              {selected ? (
                <DetailPanel
                  row={selected}
                  onClose={() => setSelectedId(null)}
                  onDeleted={(id) => {
                    setState((prev) => prev.kind === "ready"
                      ? { kind: "ready", rows: prev.rows.filter((r) => r.id !== id) }
                      : prev);
                    setSelectedId(null);
                  }}
                />
              ) : (
                <div className="bg-white rounded-3xl shadow-soft p-6 text-center text-ink-500">
                  Vælg en familie for at se profiler og handlinger.
                </div>
              )}
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "good" }) {
  return (
    <div className={`rounded-3xl shadow-soft p-4 ${accent === "good" ? "bg-good-soft" : "bg-white"}`}>
      <div className="text-3xl font-black text-ink-900">{value}</div>
      <div className="text-xs font-semibold text-ink-500 mt-1">{label}</div>
    </div>
  );
}

function DetailPanel({
  row,
  onClose,
  onDeleted,
}: {
  row: AdminFamilyRow;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteFamily(row.id);
      onDeleted(row.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke slette");
      setDeleting(false);
    }
  };

  const profiles = row.payload?.profiles ?? [];

  return (
    <div className="bg-white rounded-3xl shadow-soft p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Familie</div>
          {familyName(row) && (
            <div className="text-lg font-black text-ink-900 break-words">{familyName(row)}</div>
          )}
          <div className="font-mono text-sm font-bold text-ink-700 break-all">{formatFamilyId(row.id)}</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Luk"
          className="w-8 h-8 rounded-full bg-ink-100 text-ink-700 flex items-center justify-center active:scale-95"
        >
          ×
        </button>
      </header>

      <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-ink-700">
        <dt className="text-ink-500">Oprettet</dt><dd>{fullDate(row.createdAt)}</dd>
        <dt className="text-ink-500">Sidst aktiv</dt><dd>{fullDate(row.updatedAt)}</dd>
        <dt className="text-ink-500">Enhed</dt><dd>{row.lastDevice ?? "—"}</dd>
        <dt className="text-ink-500">PIN</dt><dd>{hasPin(row) ? "Sat" : "Ingen"}</dd>
      </dl>

      <div>
        <div className="text-sm font-bold text-ink-700 mb-2">Profiler ({profiles.length})</div>
        {profiles.length === 0 && <div className="text-sm text-ink-500">Ingen profiler oprettet.</div>}
        <div className="flex flex-col gap-2">
          {profiles.map((p) => <ProfileRow key={p.id} profile={p} />)}
        </div>
      </div>

      {error && <div className="text-bad-500 text-sm">{error}</div>}

      {confirming ? (
        <div className="flex flex-col gap-2 bg-bad-soft p-3 rounded-2xl">
          <div className="text-sm text-ink-900 font-semibold">Slet denne familie permanent?</div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="flex-1 bg-white text-ink-700 font-bold py-2 rounded-xl active:scale-95"
            >
              Fortryd
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-bad-500 text-white font-bold py-2 rounded-xl active:scale-95 disabled:opacity-50"
            >
              {deleting ? "Sletter…" : "Slet"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="bg-bad-soft text-bad-500 font-bold py-3 rounded-2xl active:scale-95 transition-transform"
        >
          Slet familie
        </button>
      )}
    </div>
  );
}

function ProfileRow({ profile }: { profile: Profile }) {
  const t = themeFor(profile.color);
  const morning = Object.values(profile.routines?.morning ?? {}).reduce((s, r) => s + (r?.tasks?.length ?? 0), 0);
  const evening = Object.values(profile.routines?.evening ?? {}).reduce((s, r) => s + (r?.tasks?.length ?? 0), 0);
  return (
    <div className="bg-cream-50 rounded-2xl p-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-xl`}>
        {profile.avatar?.emoji ?? "👤"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-ink-900 truncate">{profile.name}</div>
        <div className="text-xs text-ink-500">🌅 {morning} · 🌙 {evening}</div>
      </div>
    </div>
  );
}
