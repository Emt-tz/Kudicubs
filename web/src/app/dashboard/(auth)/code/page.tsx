import type { Metadata } from "next";
import { AuthBand } from "../../_a/AuthBand";
import { CodeForm } from "../../_a/CodeForm";
import { pendingCode } from "../../_a/data";
import { getDemoVariant, demoStatesEnabled } from "@/lib/demo-state";
import "../../_a/dashboard-a.css";

export const metadata: Metadata = { title: "Enter code" };

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_AFTER_S = 45;

// dp-04-code, dp-05-code-error (?state=wrong), dp-06-code-expired (?state=expired).
// The address and age of the code come from the httpOnly cookie sendCode() sets, so the email is never in the URL.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const variant = getDemoVariant(await searchParams, ["wrong", "expired"] as const);
  const pending = await pendingCode();
  const live = variant === null ? pending : null;
  const expired = variant === "expired" || (live !== null && live.ageMs > CODE_TTL_MS);
  const initial = variant ?? (expired ? "expired" : "idle");
  const secondsLeft = live ? Math.max(0, RESEND_AFTER_S - Math.floor(live.ageMs / 1000)) : demoStatesEnabled() && !pending ? 42 : 0;
  const email = variant ? null : (pending?.email ?? null);

  const band =
    initial === "expired"
      ? { title: "No problem, try again", body: "Codes expire to keep your family's account safe.", image: "/brand/kudi-wave.webp", alt: "Kudi the Cub waving" }
      : { title: "Check your inbox", body: "The code works once and expires in 10 minutes.", image: "/brand/kudi-headphones.webp", alt: "Kudi the Cub wearing headphones" };

  return (
    <div className="da-auth" data-screen="dp-04-code">
      <AuthBand {...band} />
      <div className="da-auth-body">
        <div>
          <h1>{initial === "expired" ? "This code has expired" : "Enter your code"}</h1>
          <p className="lead">
            {initial === "expired" ? (
              "Codes work for 10 minutes. Ask for a new one to carry on."
            ) : email || variant ? (
              <>
                We sent a 6-digit code to <strong>{email ?? "parent@example.com"}</strong>.
              </>
            ) : (
              "Enter the 6-digit code from your email."
            )}
          </p>
        </div>
        <CodeForm key={`${initial}-${email ?? ""}`} email={email} secondsLeft={secondsLeft} initial={initial} />
      </div>
    </div>
  );
}
