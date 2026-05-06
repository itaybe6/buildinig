import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware קל — רק ניווטי דפים (HTML / RSC). מטרה יחידה: לרענן את ה-cookie
 * של ה-session דרך `getUser()`. נתיבי API/Route Handlers מטפלים ב-auth שלהם
 * דרך createClient על השרת, ולכן אנחנו לא צריכים לעבור עליהם פה.
 */
function isSoftNavigationAuthRefresh(request: NextRequest): boolean {
  /** בקשות Flight / prefetch של Next — ה-layout כבר מריץ getUser בשרת; כפילות כאן מאטה ניווט */
  return (
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1"
  );
}

export async function middleware(request: NextRequest) {
  if (isSoftNavigationAuthRefresh(request)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * דלג על:
     * - api/* ו-trpc — מטופלים בשרת בנפרד, לא צריך getUser כפול
     * - _next/static, _next/image, _next/data, _next/webpack-hmr — נכסי build/dev
     * - favicon, robots, sitemap, וקבצי מדיה סטטיים
     */
    "/((?!api|trpc|_next/static|_next/image|_next/data|_next/webpack-hmr|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf)$).*)",
  ],
};
