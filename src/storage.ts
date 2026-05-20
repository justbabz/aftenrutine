import {
  AppConfig,
  ChecksState,
  emptyChecks,
  emptyConfig,
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

export function loadConfig(): AppConfig {
  const raw = safeGet(CONFIG_KEY);
  if (!raw) {
    safeRemove(LEGACY_KEY);
    return emptyConfig();
  }
  try {
    const parsed = JSON.parse(raw) as AppConfig;
    if (parsed.schemaVersion !== 2) return emptyConfig();
    return parsed;
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
