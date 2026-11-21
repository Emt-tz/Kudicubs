import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ParentSession, StaffSession, StaffRole } from "./types";

/**
 * The signed-in parent, or null. Validated against Supabase (getUser, not just the cookie).
 * Cached per request, so layouts and pages can both call it for free.
 */
export const getParent = cache(async (): Promise<ParentSession | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: row } = await supabase
    .from("parents")
    .select("id,email,region,consented_at")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!row) return null;
  return {
    userId: row.id,
    email: row.email,
    region: row.region,
    consentedAt: row.consented_at,
  };
});

/** The signed-in staff member (a row in staff_users), or null. */
export const getStaff = cache(async (): Promise<StaffSession | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: row } = await supabase
    .from("staff_users")
    .select("user_id,email,role")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!row) return null;
  return { userId: row.user_id, email: row.email, role: row.role as StaffRole };
});

/** For pages/layouts under /dashboard: returns the parent or redirects to sign-in. */
export async function requireParent(): Promise<ParentSession> {
  const parent = await getParent();
  if (!parent) redirect("/dashboard/signin");
  return parent;
}

/** For pages/layouts under /team: signed-out -> sign-in, signed-in non-staff -> no-access. */
export async function requireStaff(): Promise<StaffSession> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/team/signin");
  const staff = await getStaff();
  if (!staff) redirect("/team/no-access");
  return staff;
}
