import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-hook-secret, content-type, apikey",
};

type NotificationRecord = {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  body: string | null;
};

function normalizeRecord(r: Record<string, unknown>): NotificationRecord | null {
  const id = r.id;
  const profile_id = r.profile_id;
  const type = r.type;
  const title = r.title;
  if (
    typeof id !== "string" ||
    typeof profile_id !== "string" ||
    typeof type !== "string" ||
    typeof title !== "string"
  ) {
    return null;
  }
  const body = r.body == null ? null : String(r.body);
  return { id, profile_id, type, title, body };
}

function parsePayload(body: unknown): NotificationRecord | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (o.record && typeof o.record === "object") {
    return normalizeRecord(o.record as Record<string, unknown>);
  }
  return normalizeRecord(o);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const hookSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  if (hookSecret) {
    const sent = req.headers.get("x-hook-secret") ?? "";
    if (sent !== hookSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const record = parsePayload(payload);
  if (!record || record.type !== "service_request_new") {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(url, serviceKey);

  const { data: tokens, error: tokErr } = await admin
    .from("push_tokens")
    .select("expo_push_token")
    .eq("profile_id", record.profile_id);

  if (tokErr) {
    console.error("push_tokens query", tokErr);
    return new Response(JSON.stringify({ error: tokErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const list = (tokens ?? []) as { expo_push_token: string }[];
  if (list.length === 0) {
    return new Response(JSON.stringify({ ok: true, pushed: 0, reason: "no_tokens" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expoToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  if (!expoToken) {
    console.error("EXPO_ACCESS_TOKEN is not set");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const messages = list.map((row) => ({
    to: row.expo_push_token,
    sound: "default" as const,
    title: record.title,
    body: record.body ?? "",
    data: {
      notification_id: record.id,
      type: record.type,
    },
  }));

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${expoToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("Expo push failed", res.status, text);
    return new Response(
      JSON.stringify({ error: "Expo push failed", detail: text }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* keep raw */
  }

  return new Response(
    JSON.stringify({ ok: true, pushed: messages.length, expo: parsed }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
