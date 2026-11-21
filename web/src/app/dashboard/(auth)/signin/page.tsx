import type { Metadata } from "next";
import { AuthBand } from "../../_a/AuthBand";
import { SignInForm } from "../../_a/SignInForm";
import { getDemoState } from "@/lib/demo-state";
import "../../_a/dashboard-a.css";

export const metadata: Metadata = { title: "Sign in" };

// dp-01-signin, dp-02-signin-error (?state=error), dp-03-signin-loading (?state=loading).
// Real errors and the sending state come from the form itself; the override only opens the designs directly.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const state = getDemoState(await searchParams);
  const initial = state === "error" ? "error" : state === "loading" ? "loading" : "idle";
  return (
    <div className="da-auth" data-screen="dp-01-signin">
      <AuthBand
        image="/brand/kudi-wave.webp"
        alt="Kudi the Cub waving"
        title="Follow your family's money journey"
        body="See what each child is learning, change settings and keep your family's data in your hands."
      />
      <div className="da-auth-body">
        <div>
          <h1>Parent sign-in</h1>
          <p className="lead">We will email you a one-time code. No password to remember.</p>
        </div>
        <SignInForm key={initial} initial={initial} />
      </div>
    </div>
  );
}
