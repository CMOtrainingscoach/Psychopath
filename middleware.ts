import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/learn") ||
    path.startsWith("/admin") ||
    path.startsWith("/api/admin") ||
    path.startsWith("/api/courses") ||
    path.startsWith("/api/me") ||
    path.startsWith("/api/quiz");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Missing env must not crash Edge middleware (Vercel MIDDLEWARE_INVOCATION_FAILED).
  if (!url || !anonKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (isProtected || path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase environment variables" },
        { status: 503 },
      );
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && isProtected) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", path);
      return NextResponse.redirect(redirectUrl);
    }

    if (user && (path === "/login" || path === "/signup")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/learn";
      return NextResponse.redirect(redirectUrl);
    }

    if (user && path.startsWith("/admin")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role !== "admin") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/learn";
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (err) {
    console.error("Middleware auth error:", err);
    if (isProtected) {
      return NextResponse.json({ error: "Auth check failed" }, { status: 503 });
    }
    return NextResponse.next();
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
