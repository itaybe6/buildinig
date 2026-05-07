import { persistManagerOwnProfileRow } from "@/lib/manager/persist-manager-profile";
import { resolveResidentBearerScope } from "@/lib/resident/resolve-resident-bearer";
import { updateResidentPasswordInternal } from "@/lib/resident/update-resident-password";
import { verifyUserPassword } from "@/lib/resident/verify-user-password";
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
  const scope = await resolveResidentBearerScope(req);
  if (!scope) {
    return NextResponse.json(
      { ok: false, error: "לא מורשה" },
      { status: 401, headers: corsHeaders() }
    );
  }

  let body: {
    section?: string;
    profile?: Record<string, unknown>;
    currentPassword?: string;
    newPassword?: string;
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

  if (section === "password") {
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "").trim();
    if (newPassword.length < 6) {
      return NextResponse.json(
        { ok: false, error: "סיסמה חדשה — לפחות 6 תווים." },
        { status: 400, headers: corsHeaders() }
      );
    }

    const ok = await verifyUserPassword(
      scope.userId,
      scope.profileId,
      currentPassword
    );
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "סיסמה נוכחית שגויה." },
        { status: 400, headers: corsHeaders() }
      );
    }

    const updated = await updateResidentPasswordInternal(
      scope.userId,
      scope.profileId,
      newPassword
    );
    if (!updated.ok) {
      return NextResponse.json(
        { ok: false, error: updated.error },
        { status: 400, headers: corsHeaders() }
      );
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  }

  return NextResponse.json(
    { ok: false, error: "חסר section תקין (profile או password)." },
    { status: 400, headers: corsHeaders() }
  );
}
