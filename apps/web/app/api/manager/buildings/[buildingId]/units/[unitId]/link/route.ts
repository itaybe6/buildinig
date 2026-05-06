import { linkResidentProfileToUnit } from "@/lib/manager/building-units-mutations";
import { resolveManagerBearerScope } from "@/lib/manager/resolve-manager-bearer";
import type { Database } from "@my-project/supabase";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function bearerClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function bearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (
    authHeader?.startsWith("Bearer ") ||
    authHeader?.startsWith("bearer ")
  ) {
    return authHeader.slice(7);
  }
  return null;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ buildingId: string; unitId: string }> }
) {
  const { buildingId, unitId } = await ctx.params;
  const scope = await resolveManagerBearerScope(req);
  if (!scope) {
    return NextResponse.json(
      { ok: false, error: "לא מורשה" },
      { status: 401, headers: corsHeaders() }
    );
  }

  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "לא מורשה" },
      { status: 401, headers: corsHeaders() }
    );
  }

  const supabase = bearerClient(token);
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "שרת לא מוגדר" },
      { status: 500, headers: corsHeaders() }
    );
  }

  let body: { profile_id?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "גוף בקשה לא תקין" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const profileId = String(body.profile_id ?? "").trim();
  if (!profileId) {
    return NextResponse.json(
      { ok: false, error: "חסר מזהה פרופיל." },
      { status: 400, headers: corsHeaders() }
    );
  }

  const result = await linkResidentProfileToUnit(
    supabase,
    { businessProfileId: scope.businessProfileId },
    buildingId,
    unitId,
    profileId
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400, headers: corsHeaders() }
    );
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
