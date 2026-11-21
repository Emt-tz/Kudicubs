import { DashboardShell } from "@/components/DashboardShell";
import { requireParent } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// Signed-in Parent Dashboard. requireParent() redirects to /dashboard/signin when there is no session.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const parent = await requireParent();
  const supabase = await createClient();
  const { data } = await supabase
    .from("child_profiles")
    .select("id,nickname")
    .is("deleted_at", null)
    .order("created_at");
  return (
    <DashboardShell email={parent.email} childProfiles={data ?? []}>
      {children}
    </DashboardShell>
  );
}
