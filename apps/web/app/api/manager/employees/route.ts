import { createEmployeeForBusiness } from "@/lib/manager/create-employee";
import type { FieldStaffRole } from "@my-project/shared";
import { resolveManagerBearerScope } from "@/lib/manager/resolve-manager-bearer";
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

export async function POST(req: Request) {
  const scope = await resolveManagerBearerScope(req);
  if (!scope) {
    return NextResponse.json(
      { ok: false, error: "לא מורשה" },
      { status: 401, headers: corsHeaders() }
    );
  }

  let body: {
    full_name?: string;
    password?: string;
    phone?: string;
    field_role?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "גוף בקשה לא תקין" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const rawRole = String(body.field_role ?? "").trim();
  const fieldRole: FieldStaffRole =
    rawRole === "gardener" ? "gardener" : "cleaner";

  const result = await createEmployeeForBusiness({
    businessProfileId: scope.businessProfileId,
    fullName: String(body.full_name ?? ""),
    phoneRaw: String(body.phone ?? ""),
    password: String(body.password ?? ""),
    fieldRole,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400, headers: corsHeaders() }
    );
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
