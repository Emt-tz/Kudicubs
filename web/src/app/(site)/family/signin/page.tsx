import type { Metadata } from "next";
import { getDemoVariant } from "@/lib/demo-state";
import { FamilySignIn, type SignInDemo } from "./FamilySignIn";

export const metadata: Metadata = {
  title: "Family sign-in",
  description: "For parents and carers. We email you a one-time code, so there is no password to remember.",
};

type SP = Promise<Record<string, string | string[] | undefined>>;

// Canvas: wb-09-signin, wb-10-signin-error, wb-11-signin-sending (?state=error|sending opens a variant).
export default async function FamilySignInPage({ searchParams }: { searchParams: SP }) {
  const demo = getDemoVariant(await searchParams, ["error", "sending"] as const) as SignInDemo | null;
  return <FamilySignIn demo={demo} />;
}
