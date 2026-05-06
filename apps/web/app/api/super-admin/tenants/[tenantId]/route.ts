import { updateTenantBusiness } from "@/lib/super-admin/update-tenant-business";
import { verifySuperAdminFromRequest } from "@/lib/super-admin/verify-bearer-super-admin";
import { NextResponse } from "next/server";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ tenantId: string }> | { tenantId: string } }
) {
  const okAuth = await verifySuperAdminFromRequest(req);
  if (!okAuth) {
    return NextResponse.json(
      { ok: false, error: "אין הרשאה — נדרש חשבון סופר־אדמין." },
      { status: 403, headers: corsHeaders() }
    );
  }

  const params = await Promise.resolve(ctx.params);
  const tenantId = params.tenantId?.trim();
  if (!tenantId) {
    return NextResponse.json(
      { ok: false, error: "חסר מזהה עסק." },
      { status: 400, headers: corsHeaders() }
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

  const result = await updateTenantBusiness({
    tenantId,
    contact_email:
      typeof body.contact_email === "string"
        ? body.contact_email.trim() || null
        : null,
    contact_phone:
      typeof body.contact_phone === "string"
        ? body.contact_phone.trim() || null
        : null,
    plan:
      typeof body.plan === "string" ? body.plan.trim() || null : null,
    is_active: Boolean(body.is_active),
    legal_name:
      typeof body.legal_name === "string"
        ? body.legal_name.trim() || null
        : null,
    tax_id:
      typeof body.tax_id === "string" ? body.tax_id.trim() || null : null,
    business_mobile_phone:
      typeof body.business_mobile_phone === "string"
        ? body.business_mobile_phone.trim() || null
        : null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400, headers: corsHeaders() }
    );
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
