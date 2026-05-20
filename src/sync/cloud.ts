import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppConfig, Profile } from "../data/types";

const SYNC_STORAGE_KEY = "aftenrutine-sync-v1";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

export const cloudConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!client) {
    if (!cloudConfigured) throw new Error("Cloud sync not configured");
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 2 } },
    });
  }
  return client;
}

export interface SyncSettings {
  familyId: string;
  deviceName: string;
}

export function loadSyncSettings(): SyncSettings | null {
  try {
    const raw = localStorage.getItem(SYNC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SyncSettings;
    if (!parsed.familyId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSyncSettings(settings: SyncSettings | null): void {
  try {
    if (settings === null) localStorage.removeItem(SYNC_STORAGE_KEY);
    else localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateFamilyId(): string {
  const arr = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(arr).map((b) => ALPHA[b % ALPHA.length]).join("");
}

export function formatFamilyId(id: string): string {
  return id.replace(/(.{4})(?=.)/g, "$1-");
}

export function normalizeFamilyId(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function defaultDeviceName(): string {
  if (typeof navigator === "undefined") return "Enhed";
  const ua = navigator.userAgent;
  if (/iPad/.test(ua)) return "iPad";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Enhed";
}

export function buildInviteUrl(familyId: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}#join=${familyId}`;
}

export function parseInviteCode(hash: string): string | null {
  const match = hash.match(/[#&]join=([A-Z0-9]+)/i);
  if (!match) return null;
  const normalized = normalizeFamilyId(match[1]);
  return normalized || null;
}

export type SyncPayload = {
  profiles: Profile[];
  pin: AppConfig["pin"];
};

export function configToPayload(config: AppConfig): SyncPayload {
  return { profiles: config.profiles, pin: config.pin };
}

export function payloadIntoConfig(payload: SyncPayload, current: AppConfig): AppConfig {
  return {
    ...current,
    profiles: payload.profiles,
    pin: payload.pin ?? current.pin,
    failedAttempts: 0,
    lockedUntil: null,
  };
}

export interface FamilyRow {
  id: string;
  payload: SyncPayload;
  updatedAt: string;
}

export async function fetchFamily(familyId: string): Promise<FamilyRow | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("families")
    .select("id, payload, updated_at")
    .eq("id", familyId)
    .maybeSingle();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  if (!data) return null;
  return { id: data.id as string, payload: data.payload as SyncPayload, updatedAt: data.updated_at as string };
}

export async function pushFamily(familyId: string, payload: SyncPayload, deviceName: string): Promise<string> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("families")
    .upsert(
      {
        id: familyId,
        payload,
        last_device: deviceName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("updated_at")
    .single();
  if (error) throw error;
  return data.updated_at as string;
}

export interface SubscriptionHandle {
  unsubscribe: () => void;
}

export function subscribeFamily(
  familyId: string,
  onChange: (row: FamilyRow) => void,
): SubscriptionHandle {
  const supabase = getClient();
  const channel = supabase
    .channel(`family:${familyId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "families", filter: `id=eq.${familyId}` },
      (payload) => {
        const next = payload.new as { id: string; payload: SyncPayload; updated_at: string } | null;
        if (next) onChange({ id: next.id, payload: next.payload, updatedAt: next.updated_at });
      },
    )
    .subscribe();
  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
