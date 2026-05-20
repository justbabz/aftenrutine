import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  AppConfig,
  ChecksState,
  Profile,
  ProfileColor,
  ProfileAvatar,
  RoutineSlot,
  Task,
  Weekday,
  WEEKDAYS,
  checksKey,
  emptyChecks,
  emptyConfig,
  emptyWeeklyRoutine,
  weekdayFromDate,
} from "../data/types";
import {
  computeLockedUntil,
  hashPin,
  verifyPin,
} from "../auth";
import {
  loadChecks,
  loadConfig,
  saveChecks,
  saveConfig,
  todayKey,
} from "../storage";
import {
  buildPayload,
  cloudConfigured,
  fetchFamily,
  generateFamilyId,
  loadSyncSettings,
  payloadIntoChecks,
  payloadIntoConfig,
  pushFamily,
  saveSyncSettings,
  subscribeFamily,
  SyncSettings,
} from "../sync/cloud";

export type Screen =
  | { kind: "setup-wizard" }
  | { kind: "picker" }
  | { kind: "routine"; profileId: string; slot: RoutineSlot }
  | { kind: "admin-auth" }
  | { kind: "admin-home" }
  | { kind: "admin-profile"; profileId: string | "new" }
  | { kind: "admin-routine"; profileId: string; slot: RoutineSlot; weekday: Weekday }
  | { kind: "admin-task"; profileId: string; slot: RoutineSlot; weekday: Weekday; taskId: string | "new" };

export interface Toast {
  id: string;
  text: string;
  undo?: () => void;
}

interface State {
  config: AppConfig;
  checks: ChecksState;
  screen: Screen;
  stack: Screen[];
  adminUnlocked: boolean;
  toasts: Toast[];
  today: string;
}

type Action =
  | { type: "GOTO"; screen: Screen }
  | { type: "GO_BACK" }
  | { type: "REPLACE_SCREEN"; screen: Screen }
  | { type: "SET_CONFIG"; config: AppConfig }
  | { type: "SET_CHECKS"; checks: ChecksState }
  | { type: "TOGGLE_TASK"; profileId: string; slot: RoutineSlot; taskId: string }
  | { type: "RESET_ROUTINE"; profileId: string; slot: RoutineSlot }
  | { type: "ADMIN_UNLOCK" }
  | { type: "ADMIN_LOCK" }
  | { type: "TICK_DATE"; date: string }
  | { type: "PUSH_TOAST"; toast: Toast }
  | { type: "DISMISS_TOAST"; id: string };

function initialScreen(config: AppConfig): Screen {
  if (!config.pin || config.profiles.length === 0) return { kind: "setup-wizard" };
  return { kind: "picker" };
}

function initialState(): State {
  const config = loadConfig();
  const checks = loadChecks();
  return {
    config,
    checks,
    screen: initialScreen(config),
    stack: [],
    adminUnlocked: false,
    toasts: [],
    today: todayKey(),
  };
}

function isAdminScreen(screen: Screen): boolean {
  return screen.kind.startsWith("admin-") && screen.kind !== "admin-auth";
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "GOTO": {
      if (isAdminScreen(action.screen) && !state.adminUnlocked) {
        return { ...state, stack: [...state.stack, state.screen], screen: { kind: "admin-auth" } };
      }
      return { ...state, stack: [...state.stack, state.screen], screen: action.screen };
    }
    case "REPLACE_SCREEN": {
      if (isAdminScreen(action.screen) && !state.adminUnlocked) {
        return { ...state, screen: { kind: "admin-auth" } };
      }
      return { ...state, screen: action.screen };
    }
    case "GO_BACK": {
      if (state.stack.length === 0) {
        return { ...state, screen: { kind: "picker" } };
      }
      const previous = state.stack[state.stack.length - 1];
      return { ...state, stack: state.stack.slice(0, -1), screen: previous };
    }
    case "SET_CONFIG":
      return { ...state, config: action.config };
    case "SET_CHECKS":
      return { ...state, checks: action.checks };
    case "TOGGLE_TASK": {
      const key = checksKey(action.profileId, action.slot, state.today);
      const dayChecks = state.checks.entries[key] ?? {};
      const wasDone = !!dayChecks[action.taskId];
      const nextDay = { ...dayChecks, [action.taskId]: !wasDone };
      if (!nextDay[action.taskId]) delete nextDay[action.taskId];
      const entries = { ...state.checks.entries, [key]: nextDay };
      return { ...state, checks: { ...state.checks, entries } };
    }
    case "RESET_ROUTINE": {
      const key = checksKey(action.profileId, action.slot, state.today);
      const { [key]: _drop, ...rest } = state.checks.entries;
      return { ...state, checks: { ...state.checks, entries: rest } };
    }
    case "ADMIN_UNLOCK":
      return { ...state, adminUnlocked: true };
    case "ADMIN_LOCK": {
      const onAdmin = isAdminScreen(state.screen) || state.screen.kind === "admin-auth";
      return {
        ...state,
        adminUnlocked: false,
        screen: onAdmin ? { kind: "picker" } : state.screen,
        stack: [],
      };
    }
    case "TICK_DATE":
      return { ...state, today: action.date };
    case "PUSH_TOAST":
      return { ...state, toasts: [...state.toasts, action.toast] };
    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}

const ADMIN_IDLE_MS = 3 * 60_000;

interface AppContextValue {
  config: AppConfig;
  checks: ChecksState;
  screen: Screen;
  adminUnlocked: boolean;
  toasts: Toast[];
  today: string;

  goto(screen: Screen): void;
  goBack(): void;
  replaceScreen(screen: Screen): void;

  toggleTask(profileId: string, slot: RoutineSlot, taskId: string): void;
  resetRoutine(profileId: string, slot: RoutineSlot): void;

  setPin(pin: string): Promise<void>;
  tryUnlockAdmin(pin: string): Promise<{ ok: true } | { ok: false; lockedUntil: number | null; failedAttempts: number }>;
  unlockAdmin(): void;
  lockAdmin(): void;
  resetEverything(): void;

  addProfile(input: { name: string; avatar: ProfileAvatar; color: ProfileColor }): Profile;
  updateProfile(profile: Profile): void;
  deleteProfile(profileId: string): void;
  setFamilyName(name: string): void;
  setRoutineTasks(profileId: string, slot: RoutineSlot, weekday: Weekday, tasks: Task[]): void;
  copyRoutineToDays(profileId: string, slot: RoutineSlot, sourceDay: Weekday, targetDays: Weekday[]): void;

  pushToast(text: string, undo?: () => void): void;
  dismissToast(id: string): void;

  reportActivity(): void;

  routineTasks(profileId: string, slot: RoutineSlot, weekday?: Weekday): Task[];
  profile(id: string): Profile | undefined;
  isDone(profileId: string, slot: RoutineSlot, taskId: string): boolean;
  countDone(profileId: string, slot: RoutineSlot, weekday?: Weekday): { done: number; total: number };
  todayWeekday(): Weekday;

  // Cloud sync
  cloudAvailable: boolean;
  sync: SyncState;
  enableSyncWithNew(deviceName: string): Promise<string>;
  enableSyncWithExisting(familyId: string, deviceName: string, mode: "replace-local" | "push-local"): Promise<void>;
  disableSync(): void;
}

export type SyncState =
  | { kind: "off" }
  | { kind: "idle"; familyId: string; deviceName: string; lastSynced: string | null }
  | { kind: "syncing"; familyId: string; deviceName: string; lastSynced: string | null }
  | { kind: "error"; familyId: string; deviceName: string; lastSynced: string | null; message: string };

const AppContext = createContext<AppContextValue | null>(null);

function genId(): string {
  return crypto.randomUUID();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [sync, setSync] = useState<SyncState>(() => {
    if (!cloudConfigured) return { kind: "off" };
    const settings = loadSyncSettings();
    if (!settings) return { kind: "off" };
    return { kind: "idle", familyId: settings.familyId, deviceName: settings.deviceName, lastSynced: null };
  });
  const syncRef = useRef(sync);
  syncRef.current = sync;

  const remoteUpdatedAtRef = useRef<string | null>(null);
  const suppressNextPushRef = useRef(false);
  const initialPullDoneRef = useRef(false);

  useEffect(() => {
    saveConfig(state.config);
  }, [state.config]);

  useEffect(() => {
    saveChecks(state.checks);
  }, [state.checks]);

  // Midnight rollover.
  useEffect(() => {
    let timer: number | undefined;
    const schedule = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 5, 0);
      const ms = Math.max(1000, next.getTime() - now.getTime());
      timer = window.setTimeout(() => {
        dispatch({ type: "TICK_DATE", date: todayKey() });
        schedule();
      }, ms);
    };
    schedule();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        const t = todayKey();
        if (t !== stateRef.current.today) dispatch({ type: "TICK_DATE", date: t });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Admin idle auto-lock + hide-on-blur lock.
  const idleTimer = useRef<number | undefined>(undefined);
  const clearIdle = () => {
    if (idleTimer.current) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = undefined;
    }
  };
  const armIdle = useCallback(() => {
    clearIdle();
    if (!stateRef.current.adminUnlocked) return;
    idleTimer.current = window.setTimeout(() => {
      dispatch({ type: "ADMIN_LOCK" });
    }, ADMIN_IDLE_MS);
  }, []);

  useEffect(() => {
    armIdle();
    const onHide = () => {
      if (document.visibilityState === "hidden" && stateRef.current.adminUnlocked) {
        dispatch({ type: "ADMIN_LOCK" });
      }
    };
    const onPageHide = () => {
      if (stateRef.current.adminUnlocked) dispatch({ type: "ADMIN_LOCK" });
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      clearIdle();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [armIdle, state.adminUnlocked]);

  // Browser/Android back support.
  useEffect(() => {
    history.replaceState({ aftenrutine: true }, "");
    const onPop = () => {
      if (stateRef.current.stack.length > 0) {
        dispatch({ type: "GO_BACK" });
        history.pushState({ aftenrutine: true }, "");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Mutators on config.
  const writeConfig = useCallback((mutator: (cfg: AppConfig) => AppConfig) => {
    dispatch({ type: "SET_CONFIG", config: mutator(stateRef.current.config) });
  }, []);

  const setPin = useCallback(async (pin: string) => {
    const stored = await hashPin(pin);
    writeConfig((cfg) => ({ ...cfg, pin: stored, failedAttempts: 0, lockedUntil: null }));
  }, [writeConfig]);

  const tryUnlockAdmin = useCallback(async (pin: string) => {
    const cfg = stateRef.current.config;
    if (!cfg.pin) return { ok: false as const, lockedUntil: null, failedAttempts: 0 };
    if (cfg.lockedUntil && cfg.lockedUntil > Date.now()) {
      return { ok: false as const, lockedUntil: cfg.lockedUntil, failedAttempts: cfg.failedAttempts };
    }
    const ok = await verifyPin(pin, cfg.pin);
    if (ok) {
      writeConfig((c) => ({ ...c, failedAttempts: 0, lockedUntil: null }));
      dispatch({ type: "ADMIN_UNLOCK" });
      return { ok: true as const };
    }
    const failedAttempts = cfg.failedAttempts + 1;
    const lockedUntil = computeLockedUntil(failedAttempts);
    writeConfig((c) => ({ ...c, failedAttempts, lockedUntil }));
    return { ok: false as const, lockedUntil, failedAttempts };
  }, [writeConfig]);

  const lockAdmin = useCallback(() => dispatch({ type: "ADMIN_LOCK" }), []);
  const unlockAdmin = useCallback(() => dispatch({ type: "ADMIN_UNLOCK" }), []);

  const resetEverything = useCallback(() => {
    dispatch({ type: "SET_CONFIG", config: emptyConfig() });
    dispatch({ type: "SET_CHECKS", checks: emptyChecks() });
    dispatch({ type: "ADMIN_LOCK" });
    dispatch({ type: "REPLACE_SCREEN", screen: { kind: "setup-wizard" } });
  }, []);

  const addProfile = useCallback((input: { name: string; avatar: ProfileAvatar; color: ProfileColor }) => {
    const profile: Profile = {
      id: genId(),
      name: input.name,
      avatar: input.avatar,
      color: input.color,
      routines: { morning: emptyWeeklyRoutine(), evening: emptyWeeklyRoutine() },
    };
    writeConfig((cfg) => ({ ...cfg, profiles: [...cfg.profiles, profile] }));
    return profile;
  }, [writeConfig]);

  const updateProfile = useCallback((profile: Profile) => {
    writeConfig((cfg) => ({
      ...cfg,
      profiles: cfg.profiles.map((p) => (p.id === profile.id ? profile : p)),
    }));
  }, [writeConfig]);

  const deleteProfile = useCallback((profileId: string) => {
    writeConfig((cfg) => ({ ...cfg, profiles: cfg.profiles.filter((p) => p.id !== profileId) }));
  }, [writeConfig]);

  const setFamilyName = useCallback((name: string) => {
    const trimmed = name.trim();
    writeConfig((cfg) => ({ ...cfg, familyName: trimmed || undefined }));
  }, [writeConfig]);

  const setRoutineTasks = useCallback((profileId: string, slot: RoutineSlot, weekday: Weekday, tasks: Task[]) => {
    writeConfig((cfg) => ({
      ...cfg,
      profiles: cfg.profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              routines: {
                ...p.routines,
                [slot]: { ...p.routines[slot], [weekday]: { tasks } },
              },
            }
          : p,
      ),
    }));
  }, [writeConfig]);

  const copyRoutineToDays = useCallback((profileId: string, slot: RoutineSlot, sourceDay: Weekday, targetDays: Weekday[]) => {
    if (targetDays.length === 0) return;
    const targets = new Set(targetDays.filter((d) => d !== sourceDay));
    writeConfig((cfg) => ({
      ...cfg,
      profiles: cfg.profiles.map((p) => {
        if (p.id !== profileId) return p;
        const source = p.routines[slot][sourceDay];
        const cloneTasks = () => source.tasks.map((t) => ({ ...t }));
        const nextWeekly = {} as Record<Weekday, { tasks: Task[] }>;
        for (const day of WEEKDAYS) {
          nextWeekly[day] = targets.has(day) ? { tasks: cloneTasks() } : p.routines[slot][day];
        }
        return { ...p, routines: { ...p.routines, [slot]: nextWeekly } };
      }),
    }));
  }, [writeConfig]);

  const goto = useCallback((screen: Screen) => {
    dispatch({ type: "GOTO", screen });
    history.pushState({ aftenrutine: true }, "");
    armIdle();
  }, [armIdle]);

  const goBack = useCallback(() => dispatch({ type: "GO_BACK" }), []);
  const replaceScreen = useCallback((screen: Screen) => dispatch({ type: "REPLACE_SCREEN", screen }), []);

  const toggleTask = useCallback((profileId: string, slot: RoutineSlot, taskId: string) => {
    dispatch({ type: "TOGGLE_TASK", profileId, slot, taskId });
  }, []);

  const resetRoutine = useCallback((profileId: string, slot: RoutineSlot) => {
    dispatch({ type: "RESET_ROUTINE", profileId, slot });
  }, []);

  const pushToast = useCallback((text: string, undo?: () => void) => {
    const id = genId();
    dispatch({ type: "PUSH_TOAST", toast: { id, text, undo } });
    window.setTimeout(() => dispatch({ type: "DISMISS_TOAST", id }), 8000);
  }, []);

  const dismissToast = useCallback((id: string) => dispatch({ type: "DISMISS_TOAST", id }), []);

  const reportActivity = useCallback(() => armIdle(), [armIdle]);

  const routineTasks = useCallback((profileId: string, slot: RoutineSlot, weekday?: Weekday) => {
    const p = stateRef.current.config.profiles.find((pp) => pp.id === profileId);
    if (!p) return [];
    const day = weekday ?? weekdayFromDate();
    return p.routines[slot][day]?.tasks ?? [];
  }, []);

  const profile = useCallback((id: string) => {
    return stateRef.current.config.profiles.find((p) => p.id === id);
  }, []);

  const isDone = useCallback((profileId: string, slot: RoutineSlot, taskId: string) => {
    const key = checksKey(profileId, slot, stateRef.current.today);
    return !!stateRef.current.checks.entries[key]?.[taskId];
  }, []);

  const countDone = useCallback((profileId: string, slot: RoutineSlot, weekday?: Weekday) => {
    const tasks = routineTasks(profileId, slot, weekday);
    const key = checksKey(profileId, slot, stateRef.current.today);
    const day = stateRef.current.checks.entries[key] ?? {};
    const done = tasks.filter((t) => day[t.id]).length;
    return { done, total: tasks.length };
  }, [routineTasks]);

  const todayWeekday = useCallback(() => weekdayFromDate(), []);

  // ---------- Cloud sync ----------

  const setSyncSettings = useCallback((settings: SyncSettings | null) => {
    saveSyncSettings(settings);
    if (!settings) setSync({ kind: "off" });
  }, []);

  const enableSyncWithNew = useCallback(async (deviceName: string): Promise<string> => {
    const id = generateFamilyId();
    setSync({ kind: "syncing", familyId: id, deviceName, lastSynced: null });
    try {
      const payload = buildPayload(stateRef.current.config, stateRef.current.checks);
      const updatedAt = await pushFamily(id, payload, deviceName);
      remoteUpdatedAtRef.current = updatedAt;
      setSyncSettings({ familyId: id, deviceName });
      setSync({ kind: "idle", familyId: id, deviceName, lastSynced: updatedAt });
      return id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ukendt fejl";
      setSync({ kind: "error", familyId: id, deviceName, lastSynced: null, message: msg });
      throw e;
    }
  }, [setSyncSettings]);

  const enableSyncWithExisting = useCallback(async (
    rawId: string,
    deviceName: string,
    mode: "replace-local" | "push-local",
  ): Promise<void> => {
    const id = rawId.trim();
    setSync({ kind: "syncing", familyId: id, deviceName, lastSynced: null });
    try {
      if (mode === "replace-local") {
        const row = await fetchFamily(id);
        if (!row) {
          // No remote row → create from local
          const payload = buildPayload(stateRef.current.config, stateRef.current.checks);
          const updatedAt = await pushFamily(id, payload, deviceName);
          remoteUpdatedAtRef.current = updatedAt;
        } else {
          suppressNextPushRef.current = true;
          dispatch({ type: "SET_CONFIG", config: payloadIntoConfig(row.payload, stateRef.current.config) });
          dispatch({ type: "SET_CHECKS", checks: payloadIntoChecks(row.payload, stateRef.current.checks) });
          remoteUpdatedAtRef.current = row.updatedAt;
        }
      } else {
        const payload = buildPayload(stateRef.current.config, stateRef.current.checks);
        const updatedAt = await pushFamily(id, payload, deviceName);
        remoteUpdatedAtRef.current = updatedAt;
      }
      setSyncSettings({ familyId: id, deviceName });
      setSync({ kind: "idle", familyId: id, deviceName, lastSynced: remoteUpdatedAtRef.current });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ukendt fejl";
      setSync({ kind: "error", familyId: id, deviceName, lastSynced: null, message: msg });
      throw e;
    }
  }, [setSyncSettings]);

  const disableSync = useCallback(() => {
    setSyncSettings(null);
    remoteUpdatedAtRef.current = null;
    initialPullDoneRef.current = false;
  }, [setSyncSettings]);

  // Initial pull on mount or when sync turns on.
  useEffect(() => {
    if (sync.kind === "off") {
      initialPullDoneRef.current = false;
      return;
    }
    if (initialPullDoneRef.current) return;
    initialPullDoneRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const row = await fetchFamily(sync.familyId);
        if (cancelled) return;
        if (row) {
          suppressNextPushRef.current = true;
          dispatch({ type: "SET_CONFIG", config: payloadIntoConfig(row.payload, stateRef.current.config) });
          dispatch({ type: "SET_CHECKS", checks: payloadIntoChecks(row.payload, stateRef.current.checks) });
          remoteUpdatedAtRef.current = row.updatedAt;
          setSync((s) => s.kind === "off" ? s : { kind: "idle", familyId: s.familyId, deviceName: s.deviceName, lastSynced: row.updatedAt });
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Sync-fejl";
        setSync((s) => s.kind === "off" ? s : { kind: "error", familyId: s.familyId, deviceName: s.deviceName, lastSynced: s.lastSynced, message: msg });
      }
    })();
    return () => { cancelled = true; };
  }, [sync.kind === "off" ? "off" : sync.familyId]);

  // Realtime subscription.
  useEffect(() => {
    if (sync.kind === "off") return;
    const familyId = sync.familyId;
    const handle = subscribeFamily(familyId, (row) => {
      if (row.updatedAt === remoteUpdatedAtRef.current) return;
      suppressNextPushRef.current = true;
      dispatch({ type: "SET_CONFIG", config: payloadIntoConfig(row.payload, stateRef.current.config) });
      dispatch({ type: "SET_CHECKS", checks: payloadIntoChecks(row.payload, stateRef.current.checks) });
      remoteUpdatedAtRef.current = row.updatedAt;
      setSync((s) => s.kind === "off" ? s : { kind: "idle", familyId: s.familyId, deviceName: s.deviceName, lastSynced: row.updatedAt });
    });
    return () => handle.unsubscribe();
  }, [sync.kind === "off" ? "off" : sync.familyId]);

  // Push local config changes to cloud (debounced).
  useEffect(() => {
    if (sync.kind === "off") return;
    if (suppressNextPushRef.current) {
      suppressNextPushRef.current = false;
      return;
    }
    const familyId = sync.familyId;
    const deviceName = sync.deviceName;
    const timer = window.setTimeout(async () => {
      try {
        setSync((s) => s.kind === "off" ? s : { kind: "syncing", familyId: s.familyId, deviceName: s.deviceName, lastSynced: s.lastSynced });
        const payload = buildPayload(stateRef.current.config, stateRef.current.checks);
        const updatedAt = await pushFamily(familyId, payload, deviceName);
        remoteUpdatedAtRef.current = updatedAt;
        setSync((s) => s.kind === "off" ? s : { kind: "idle", familyId: s.familyId, deviceName: s.deviceName, lastSynced: updatedAt });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sync-fejl";
        setSync((s) => s.kind === "off" ? s : { kind: "error", familyId: s.familyId, deviceName: s.deviceName, lastSynced: s.lastSynced, message: msg });
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [state.config, state.checks, sync.kind === "off" ? "off" : sync.familyId, sync.kind === "off" ? "" : sync.deviceName]);

  const value = useMemo<AppContextValue>(() => ({
    config: state.config,
    checks: state.checks,
    screen: state.screen,
    adminUnlocked: state.adminUnlocked,
    toasts: state.toasts,
    today: state.today,
    goto,
    goBack,
    replaceScreen,
    toggleTask,
    resetRoutine,
    setPin,
    tryUnlockAdmin,
    unlockAdmin,
    lockAdmin,
    resetEverything,
    addProfile,
    updateProfile,
    deleteProfile,
    setFamilyName,
    setRoutineTasks,
    copyRoutineToDays,
    pushToast,
    dismissToast,
    reportActivity,
    routineTasks,
    profile,
    isDone,
    countDone,
    todayWeekday,
    cloudAvailable: cloudConfigured,
    sync,
    enableSyncWithNew,
    enableSyncWithExisting,
    disableSync,
  }), [
    state.config, state.checks, state.screen, state.adminUnlocked, state.toasts, state.today,
    goto, goBack, replaceScreen, toggleTask, resetRoutine,
    setPin, tryUnlockAdmin, unlockAdmin, lockAdmin, resetEverything,
    addProfile, updateProfile, deleteProfile, setFamilyName, setRoutineTasks, copyRoutineToDays,
    pushToast, dismissToast, reportActivity,
    routineTasks, profile, isDone, countDone, todayWeekday,
    sync, enableSyncWithNew, enableSyncWithExisting, disableSync,
  ]);

  return (
    <AppContext.Provider value={value}>
      <ActivityBlanket onActivity={reportActivity}>{children}</ActivityBlanket>
    </AppContext.Provider>
  );
}

function ActivityBlanket({ children, onActivity }: { children: ReactNode; onActivity: () => void }) {
  useEffect(() => {
    const handler = () => onActivity();
    document.addEventListener("touchstart", handler, { passive: true });
    document.addEventListener("pointerdown", handler, { passive: true });
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("pointerdown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [onActivity]);
  return <>{children}</>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
