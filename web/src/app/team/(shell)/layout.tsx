import { TeamShell } from "@/components/TeamShell";
import { requireStaff } from "@/lib/auth/session";

// Signed-in Team Console. requireStaff() sends signed-out users to sign-in and non-staff to no-access.
export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  return (
    <TeamShell email={staff.email} role={staff.role}>
      {children}
    </TeamShell>
  );
}
