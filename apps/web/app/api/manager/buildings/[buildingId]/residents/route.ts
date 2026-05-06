import { inviteResidentToBuilding } from "@/lib/manager/invite-resident-to-building";
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

export async function POST(
  req: Request,
  ctx: { params: Promise<{ buildingId: string }> }
) {
  const { buildingId } = await ctx.params;
  const scope = await resolveManagerBearerScope(req);
  if (!scope) {
    return NextResponse.json(
      { ok: false, error: "לא מורשה" },
      { status: 401, headers: corsHeaders() }
    );
  }

  let body: {
    full_name?: string;
    email?: string;
    password?: string;
    phone?: string;
    unit_id?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "גוף בקשה לא תקין" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const unitId = body.unit_id ? String(body.unit_id).trim() : undefined;

  const result = await inviteResidentToBuilding({
    businessProfileId: scope.businessProfileId,
    buildingId,
    fullName: String(body.full_name ?? ""),
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
    phone: body.phone ? String(body.phone) : undefined,
    unitId: unitId || undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400, headers: corsHeaders() }
    );
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
