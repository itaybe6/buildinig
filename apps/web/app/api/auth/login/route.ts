import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { profilePhoneLookupVariants } from "@my-project/shared";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";

const corsHeadersOpen = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

/** CORS רק לקריאות cross-origin (מובייל); בדפדפן same-origin — בלי `*` כדי לא לפגוע ב-Set-Cookie */
function corsHeadersFor(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin) return {};
  try {
    if (request.nextUrl.host === new URL(origin).host) {
      return {};
    }
  } catch {
    return {};
  }
  return { ...corsHeadersOpen };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeadersOpen });
}

export async function POST(request: NextRequest) {
  if (!hasServiceRoleKey()) {
    return NextResponse.json(
      { error: "שרת לא מוגדר לאימות (חסר SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 500, headers: corsHeadersFor(request) }
    );
  }

  let body: { phone?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "בקשה לא תקינה" },
      { status: 400, headers: corsHeadersFor(request) }
    );
  }

  const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const phoneVariants = profilePhoneLookupVariants(phoneRaw);

  if (phoneVariants.length === 0 || password.length < 6) {
    return NextResponse.json(
      { error: "פרטי התחברות שגויים" },
      { status: 401, headers: corsHeadersFor(request) }
    );
  }

  const admin = createAdminClient();

  const { data: profileRows, error: profileError } = await admin
    .from("profiles")
    .select("id, auth_user_id, password_hash, is_active, role")
    .in("phone", phoneVariants);

  if (profileError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth/login] profiles query", profileError);
    }
    return NextResponse.json(
      { error: "פרטי התחברות שגויים" },
      { status: 401, headers: corsHeadersFor(request) }
    );
  }

  const profile = profileRows?.find((row) => row.auth_user_id) ?? null;

  if (!profile?.auth_user_id) {
    return NextResponse.json(
      { error: "פרטי התחברות שגויים" },
      { status: 401, headers: corsHeadersFor(request) }
    );
  }

  if (profile.is_active === false) {
    return NextResponse.json(
      { error: "החשבון לא פעיל" },
      { status: 403, headers: corsHeadersFor(request) }
    );
  }

  const { data: userData, error: authUserError } =
    await admin.auth.admin.getUserById(profile.auth_user_id);

  const email = userData.user?.email;
  if (authUserError || !email) {
    return NextResponse.json(
      { error: "חשבון לא מוגדר נכון בשרת — פנה למנהל" },
      { status: 500, headers: corsHeadersFor(request) }
    );
  }

  /**
   * ב-Route Handler, `cookies().set` לפעמים נכשל בשקט או לא נסגר עם גוף ה-JSON.
   * משכפלים את דפוס ה-middleware: מצטברים על NextResponse עם אפשרויות מלאות.
   */
  let lastAuthCookies: {
    name: string;
    value: string;
    options: CookieOptions;
  }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          lastAuthCookies = cookiesToSet;
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );

  function jsonWithSessionCookies(
    body: Record<string, unknown>,
    status: number
  ) {
    const res = NextResponse.json(body, {
      status,
      headers: corsHeadersFor(request),
    });
    lastAuthCookies.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
  }

  /** סיסמה ב-profiles (bcrypt) — למשתמשים מהמיגרציה / עדכון ידני */
  if (profile.password_hash) {
    const passwordOk = await bcrypt.compare(password, profile.password_hash);
    if (!passwordOk) {
      return NextResponse.json(
        { error: "פרטי התחברות שגויים" },
        { status: 401, headers: corsHeadersFor(request) }
      );
    }

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    const tokenHash = linkData?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      console.error("[auth/login] generateLink", linkError);
      return NextResponse.json(
        { error: "שגיאת התחברות פנימית" },
        { status: 500, headers: corsHeadersFor(request) }
      );
    }

    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });

    if (otpError || !otpData.session) {
      console.error("[auth/login] verifyOtp", otpError);
      return NextResponse.json(
        { error: "שגיאת התחברות פנימית" },
        { status: 500, headers: corsHeadersFor(request) }
      );
    }

    return jsonWithSessionCookies(
      {
        ok: true,
        session: otpData.session,
        role: profile.role,
      },
      200
    );
  }

  /** אין password_hash בפרופיל — סיסמת Auth בלבד (הזמנות / יצירת משתמש מהאפליקציה) */
  const { data: signData, error: signErr } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (signErr || !signData.session) {
    if (process.env.NODE_ENV === "development" && signErr) {
      console.error("[auth/login] signInWithPassword", signErr.message);
    }
    return NextResponse.json(
      { error: "פרטי התחברות שגויים" },
      { status: 401, headers: corsHeadersFor(request) }
    );
  }

  return jsonWithSessionCookies(
    { ok: true, session: signData.session, role: profile.role },
    200
  );
}
