import {
  AppConfig,
  ChecksState,
  Profile,
  Routine,
  RoutineSlot,
  Weekday,
  WEEKDAYS,
  WeeklyRoutine,
  emptyChecks,
  emptyConfig,
  emptyWeeklyRoutine,
} from "./data/types";

const CONFIG_KEY = "aftenrutine-config-v2";
const CHECKS_KEY = "aftenrutine-checks-v2";
const LEGACY_KEY = "aftenrutine-v1";
const MAX_AGE_DAYS = 14;

export function todayKey(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* QuotaExceededError or private mode — ignore */
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

interface LegacyV2Profile {
  id: string;
  name: string;
  avatar: { arasaacId: number | null; emoji: string };
  color: string;
  routines: Record<RoutineSlot, Routine>;
}

function expandToWeekly(routine: Routine): WeeklyRoutine {
  const cloned = (): Routine => ({ tasks: routine.tasks.map((t) => ({ ...t })) });
  const out = {} as WeeklyRoutine;
  for (const day of WEEKDAYS) out[day] = cloned();
  return out;
}

function migrateV2ToV3(raw: { profiles: LegacyV2Profile[] } & Omit<AppConfig, "profiles" | "schemaVersion">): AppConfig {
  const profiles: Profile[] = raw.profiles.map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    color: p.color as Profile["color"],
    routines: {
      morning: expandToWeekly(p.routines?.morning ?? { tasks: [] }),
      evening: expandToWeekly(p.routines?.evening ?? { tasks: [] }),
    },
  }));
  return {
    schemaVersion: 3,
    profiles,
    pin: raw.pin,
    failedAttempts: raw.failedAttempts ?? 0,
    lockedUntil: raw.lockedUntil ?? null,
  };
}

function ensureWeeklyShape(config: AppConfig): AppConfig {
  let mutated = false;
  const profiles = config.profiles.map((p) => {
    const routines = p.routines as unknown as Record<RoutineSlot, WeeklyRoutine | Routine>;
    const morning = routines.morning;
    const evening = routines.evening;
    const morningOk = morning && WEEKDAYS.every((d) => (morning as WeeklyRoutine)[d]);
    const eveningOk = evening && WEEKDAYS.every((d) => (evening as WeeklyRoutine)[d]);
    if (morningOk && eveningOk) return p;
    mutated = true;
    const safeMorning: WeeklyRoutine = morningOk
      ? (morning as WeeklyRoutine)
      : expandToWeekly((morning as Routine) ?? { tasks: [] });
    const safeEvening: WeeklyRoutine = eveningOk
      ? (evening as WeeklyRoutine)
      : expandToWeekly((evening as Routine) ?? { tasks: [] });
    // Fill missing days defensively.
    for (const day of WEEKDAYS) {
      if (!safeMorning[day]) safeMorning[day] = { tasks: [] };
      if (!safeEvening[day]) safeEvening[day] = { tasks: [] };
    }
    return { ...p, routines: { morning: safeMorning, evening: safeEvening } };
  });
  return mutated ? { ...config, profiles } : config;
}

export function loadConfig(): AppConfig {
  const raw = safeGet(CONFIG_KEY);
  if (!raw) {
    safeRemove(LEGACY_KEY);
    return emptyConfig();
  }
  try {
    const parsed = JSON.parse(raw) as AppConfig | (Omit<AppConfig, "schemaVersion" | "profiles"> & { schemaVersion: 2; profiles: LegacyV2Profile[] });
    if (parsed.schemaVersion === 3) return ensureWeeklyShape(parsed);
    if (parsed.schemaVersion === 2) return migrateV2ToV3(parsed);
    return emptyConfig();
  } catch {
    return emptyConfig();
  }
}

export function saveConfig(config: AppConfig): void {
  safeSet(CONFIG_KEY, JSON.stringify(config));
}

function gcChecks(state: ChecksState): ChecksState {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
  const cutoffKey = todayKey(cutoff);
  const next: ChecksState["entries"] = {};
  for (const [key, value] of Object.entries(state.entries)) {
    const date = key.split(":")[2];
    if (!date) continue;
    if (date >= cutoffKey) next[key] = value;
  }
  return { schemaVersion: 2, entries: next };
}

export function loadChecks(): ChecksState {
  const raw = safeGet(CHECKS_KEY);
  if (!raw) return emptyChecks();
  try {
    const parsed = JSON.parse(raw) as ChecksState;
    if (parsed.schemaVersion !== 2) return emptyChecks();
    return gcChecks(parsed);
  } catch {
    return emptyChecks();
  }
}

export function saveChecks(state: ChecksState): void {
  safeSet(CHECKS_KEY, JSON.stringify(state));
}

export { emptyWeeklyRoutine, WEEKDAYS };
export type { Weekday };
