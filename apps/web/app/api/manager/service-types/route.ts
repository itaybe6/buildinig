import { createServiceTypeForBusiness } from "@/lib/manager/create-service-type";
import {
  createSupabaseForBearerRequest,
  resolveManagerBearerScope,
} from "@/lib/manager/resolve-manager-bearer";
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

  const supabase = createSupabaseForBearerRequest(req);
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "שגיאת הגדרות שרת" },
      { status: 500, headers: corsHeaders() }
    );
  }

  let body: {
    name?: string;
    description?: string | null;
    price_min?: string | null;
    price_max?: string | null;
    is_active?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "גוף בקשה לא תקין" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const result = await createServiceTypeForBusiness(supabase, scope.businessProfileId, {
    name: String(body.name ?? ""),
    description:
      body.description === undefined || body.description === null
        ? null
        : String(body.description),
    price_min:
      body.price_min === undefined || body.price_min === null
        ? null
        : String(body.price_min),
    price_max:
      body.price_max === undefined || body.price_max === null
        ? null
        : String(body.price_max),
    is_active: body.is_active ?? true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400, headers: corsHeaders() }
    );
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
