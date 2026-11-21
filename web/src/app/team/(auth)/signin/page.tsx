import type { Metadata } from "next";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Staff sign-in" };

// tc-01-signin: email one-time code. Never reveals whether an address belongs to staff.
export default function Page() {
  return (
    <div data-screen="tc-01-signin">
      <SignInForm />
    </div>
  );
}
