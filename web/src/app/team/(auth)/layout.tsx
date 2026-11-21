import { AuthFrame } from "@/components/AuthFrame";

// Public Team Console pages (sign-in, no access, error, signed out): centred, no sidebar.
export default function TeamAuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthFrame>{children}</AuthFrame>;
}
