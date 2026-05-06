import { bootstrapBusiness } from "@/lib/super-admin/bootstrap-business";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@my-project/supabase";
import { NextResponse } from "next/server";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

async function verifySuperAdminFromRequest(req: Request): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;

  const authHeader = req.headers.get("authorization");
  const token =
    authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader?.startsWith("bearer ")
        ? authHeader.slice(7)
        : null;

  if (!token) return false;

  const supabase = createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return profile?.role === "super_admin";
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request) {
  const okAuth = await verifySuperAdminFromRequest(req);
  if (!okAuth) {
    return NextResponse.json(
      { ok: false, error: "אין הרשאה — נדרש חשבון סופר־אדמין." },
      { status: 403, headers: corsHeaders() }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "גוף הבקשה אינו JSON תקין." },
      { status: 400, headers: corsHeaders() }
    );
  }

  const result = await bootstrapBusiness({
    name: String(body.name ?? ""),
    legalName: String(body.legal_name ?? ""),
    contactEmail: String(body.contact_email ?? ""),
    managerFullName: String(body.manager_full_name ?? ""),
    managerEmail: String(body.manager_email ?? ""),
    managerPhone: String(body.manager_phone ?? ""),
    managerPassword: String(body.manager_password ?? ""),
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400, headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    { ok: true, tenantId: result.tenantId },
    { headers: corsHeaders() }
  );
}
