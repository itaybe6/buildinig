import {
  deleteEmployeeForBusiness,
  updateEmployeeForBusiness,
  type UpdatableEmployeeRole,
} from "@/lib/manager/mutate-employee";
import { resolveManagerBearerScope } from "@/lib/manager/resolve-manager-bearer";
import { NextResponse } from "next/server";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function parseFieldRole(raw: string): UpdatableEmployeeRole {
  if (raw === "gardener") return "gardener";
  if (raw === "employee") return "employee";
  return "cleaner";
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ employeeId: string }> }
) {
  const scope = await resolveManagerBearerScope(req);
  if (!scope) {
    return NextResponse.json(
      { ok: false, error: "לא מורשה" },
      { status: 401, headers: corsHeaders() }
    );
  }

  const { employeeId } = await ctx.params;

  let body: {
    full_name?: string;
    phone?: string;
    field_role?: string;
    is_active?: boolean;
    new_password?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "גוף בקשה לא תקין" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const newPasswordRaw = body.new_password;
  const newPassword =
    typeof newPasswordRaw === "string" && newPasswordRaw.trim().length > 0
      ? newPasswordRaw.trim()
      : undefined;

  const result = await updateEmployeeForBusiness({
    businessProfileId: scope.businessProfileId,
    employeeProfileId: employeeId,
    fullName: String(body.full_name ?? ""),
    phoneRaw: String(body.phone ?? ""),
    fieldRole: parseFieldRole(String(body.field_role ?? "")),
    isActive: Boolean(body.is_active),
    newPassword,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400, headers: corsHeaders() }
    );
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ employeeId: string }> }
) {
  const scope = await resolveManagerBearerScope(req);
  if (!scope) {
    return NextResponse.json(
      { ok: false, error: "לא מורשה" },
      { status: 401, headers: corsHeaders() }
    );
  }

  const { employeeId } = await ctx.params;

  const result = await deleteEmployeeForBusiness({
    businessProfileId: scope.businessProfileId,
    employeeProfileId: employeeId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400, headers: corsHeaders() }
    );
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
