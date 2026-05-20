// Supabase Edge Function: admin-api
//
// Eneste server-side endpoint som admin-dashboardet taler med.
// Verificerer admin-password (SHA-256 sammenligning med ADMIN_PASSWORD_HASH),
// og bruger service-role-nøglen til at læse/slette i families-tabellen.
//
// Deploy:  supabase functions deploy admin-api --no-verify-jwt
// Secrets: supabase secrets set ADMIN_PASSWORD_HASH=<sha256-hex>
//
// (SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY er auto-sat af platformen.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ADMIN_PASSWORD_HASH = (Deno.env.get("ADMIN_PASSWORD_HASH") ?? "").toLowerCase();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, x-admin-password, apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  if (!ADMIN_PASSWORD_HASH) return json({ error: "ADMIN_PASSWORD_HASH not set on server" }, 500);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "supabase env missing" }, 500);

  const password = req.headers.get("x-admin-password") ?? "";
  if (!password) return json({ error: "missing password" }, 401);

  const givenHash = await sha256Hex(password);
  if (!timingSafeEqual(givenHash, ADMIN_PASSWORD_HASH)) {
    return json({ error: "unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "list";
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  if (action === "list") {
    const { data, error } = await supabase
      .from("families")
      .select("id, payload, last_device, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ rows: data ?? [] });
  }

  if (action === "delete") {
    let body: { id?: string };
    try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }
    const id = (body?.id ?? "").trim();
    if (!id) return json({ error: "missing id" }, 400);
    const { error } = await supabase.from("families").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: "unknown action" }, 400);
});
