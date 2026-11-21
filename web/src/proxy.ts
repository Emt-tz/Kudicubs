import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import { PUBLIC_DASHBOARD_PATHS, PUBLIC_TEAM_PATHS } from "@/lib/auth/types";

/*
 * Next.js 16 "proxy" (formerly middleware). It refreshes the Supabase session cookie and gives an
 * optimistic gate for /dashboard/** (parents) and /team/** (staff). The layouts re-check with
 * requireParent()/requireStaff(), and the database enforces the real access rules with RLS.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  const redirectTo = (to: string) => {
    const r = NextResponse.redirect(new URL(to, request.url));
    for (const c of response.cookies.getAll()) r.cookies.set(c); // keep refreshed session cookies
    return r;
  };

  const isTeam = path === "/team" || path.startsWith("/team/");
  const publicPaths: readonly string[] = isTeam ? PUBLIC_TEAM_PATHS : PUBLIC_DASHBOARD_PATHS;
  if (publicPaths.includes(path)) {
    // Still run getUser so an expired session cookie gets refreshed/cleared.
    await supabase.auth.getUser();
    return response;
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) return redirectTo(isTeam ? "/team/signin" : "/dashboard/signin");

  if (isTeam) {
    const { data: staff } = await supabase
      .from("staff_users")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!staff) return redirectTo("/team/no-access");
  }
  return response;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/team", "/team/:path*"],
};
