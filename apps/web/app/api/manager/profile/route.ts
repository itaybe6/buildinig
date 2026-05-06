import {
  persistManagerBusinessProfile,
  persistManagerOwnProfileRow,
} from "@/lib/manager/persist-manager-profile";
import { resolveManagerBearerScope } from "@/lib/manager/resolve-manager-bearer";
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

export async function PATCH(req: Request) {
  const scope = await resolveManagerBearerScope(req);
  if (!scope) {
    return NextResponse.json(
      { ok: false, error: "לא מורשה" },
      { status: 401, headers: corsHeaders() }
    );
  }

  let body: {
    section?: string;
    business?: Record<string, unknown>;
    profile?: Record<string, unknown>;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "גוף בקשה לא תקין" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const section = String(body.section ?? "").trim();

  if (section === "business") {
    const b = body.business ?? {};
    const name = String(b.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { ok: false, error: "חובה למלא שם עסק." },
        { status: 400, headers: corsHeaders() }
      );
    }

    const result = await persistManagerBusinessProfile(scope.tenantId, {
      name,
      logo_url: String(b.logo_url ?? "").trim() || null,
      primary_color: String(b.primary_color ?? "").trim() || null,
      contact_email: String(b.contact_email ?? "").trim() || null,
      contact_phone: String(b.contact_phone ?? "").trim() || null,
      legal_name: String(b.legal_name ?? "").trim() || null,
      tax_id: String(b.tax_id ?? "").trim() || null,
      notes: String(b.notes ?? "").trim() || null,
      about: String(b.about ?? "").trim() || null,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400, headers: corsHeaders() }
      );
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  }

  if (section === "profile") {
    const p = body.profile ?? {};
    const full_name = String(p.full_name ?? "").trim();
    if (!full_name) {
      return NextResponse.json(
        { ok: false, error: "חובה למלא שם מלא." },
        { status: 400, headers: corsHeaders() }
      );
    }

    const result = await persistManagerOwnProfileRow(
      scope.profileId,
      scope.userId,
      {
        full_name,
        phone: String(p.phone ?? "").trim() || null,
      }
    );

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400, headers: corsHeaders() }
      );
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  }

  return NextResponse.json(
    { ok: false, error: "חסר section תקין (business או profile)." },
    { status: 400, headers: corsHeaders() }
  );
}
