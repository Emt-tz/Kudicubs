import { AuthFrame } from "@/components/AuthFrame";

// Public Parent Dashboard pages (sign-in, code, session timeout, forbidden, deleted): centred, no sidebar.
export default function DashboardAuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthFrame>{children}</AuthFrame>;
}
