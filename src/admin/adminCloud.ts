import { cloudConfigured, getClient } from "../sync/cloud";
import type { SyncPayload } from "../sync/cloud";

export { cloudConfigured };

export interface AdminFamilyRow {
  id: string;
  payload: SyncPayload;
  lastDevice: string | null;
  createdAt: string | null;
  updatedAt: string;
}

interface RawRow {
  id: string;
  payload: SyncPayload;
  last_device: string | null;
  created_at: string | null;
  updated_at: string;
}

function toRow(raw: RawRow): AdminFamilyRow {
  return {
    id: raw.id,
    payload: raw.payload,
    lastDevice: raw.last_device,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export async function listAllFamilies(): Promise<AdminFamilyRow[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("families")
    .select("id, payload, last_device, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => toRow(r as RawRow));
}

export async function deleteFamily(id: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.from("families").delete().eq("id", id);
  if (error) throw error;
}

export interface AdminSubscription {
  unsubscribe: () => void;
}

export type ChangeKind = "insert" | "update" | "delete";

export interface ChangeEvent {
  kind: ChangeKind;
  row: AdminFamilyRow | null;
  oldId: string | null;
}

export function subscribeAllFamilies(onChange: (event: ChangeEvent) => void): AdminSubscription {
  const supabase = getClient();
  const channel = supabase
    .channel("admin:families")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "families" },
      (payload) => {
        const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
        if (eventType === "DELETE") {
          const old = payload.old as { id?: string } | null;
          onChange({ kind: "delete", row: null, oldId: old?.id ?? null });
          return;
        }
        const next = payload.new as RawRow | null;
        if (!next) return;
        onChange({
          kind: eventType === "INSERT" ? "insert" : "update",
          row: toRow(next),
          oldId: null,
        });
      },
    )
    .subscribe();
  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
