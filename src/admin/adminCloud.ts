import type { SyncPayload } from "../sync/cloud";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";
const ADMIN_API_URL = SUPABASE_URL ? `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/admin-api` : "";

export const adminConfigured = Boolean(SUPABASE_URL && ANON_KEY);

const PW_KEY = "familierutine-admin-pw";

export function getStoredPassword(): string {
  return sessionStorage.getItem(PW_KEY) ?? "";
}

export function storePassword(pw: string): void {
  sessionStorage.setItem(PW_KEY, pw);
}

export function clearPassword(): void {
  sessionStorage.removeItem(PW_KEY);
}

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

export class AdminAuthError extends Error {
  constructor(message = "unauthorized") { super(message); this.name = "AdminAuthError"; }
}

async function call<T>(action: string, password: string, body?: object): Promise<T> {
  if (!adminConfigured) throw new Error("Supabase env mangler");
  const res = await fetch(`${ADMIN_API_URL}?action=${encodeURIComponent(action)}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-password": password,
      "authorization": `Bearer ${ANON_KEY}`,
      "apikey": ANON_KEY,
    },
    body: body ? JSON.stringify(body) : "{}",
  });
  if (res.status === 401) throw new AdminAuthError();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export async function verifyPassword(password: string): Promise<void> {
  await call<{ rows: RawRow[] }>("list", password);
}

export async function listAllFamilies(): Promise<AdminFamilyRow[]> {
  const { rows } = await call<{ rows: RawRow[] }>("list", getStoredPassword());
  return rows.map(toRow);
}

export async function deleteFamily(id: string): Promise<void> {
  await call<{ ok: true }>("delete", getStoredPassword(), { id });
}
