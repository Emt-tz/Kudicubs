import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, assertSupabaseEnv } from "@/lib/env";

/**
 * Server Supabase client bound to the request's cookies (Server Components, Server Actions,
 * Route Handlers). Acts AS THE SIGNED-IN USER with the anon key, so row-level security applies.
 * There is deliberately no service-role/admin client in the web app.
 */
export async function createClient() {
  assertSupabaseEnv();
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are read-only there. The proxy refreshes them.
        }
      },
    },
  });
}
