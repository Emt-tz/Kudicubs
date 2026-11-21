import Link from "next/link";
import type { Metadata } from "next";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { StatusCard } from "../../_lib/ui";

export const metadata: Metadata = { title: "No access (403)" };

// tc-09-no-access: signed in, but not a staff member. No family data is requested on this page.
export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return (
    <StatusCard
      screen="tc-09-no-access"
      title="You do not have access to this page"
      body="The Team Console is for KudiCubs staff. If you should have access, ask an admin to add your work email."
      reference="403 No access"
      actions={
        <>
          {data.user ? (
            <form action={signOut.bind(null, "team")}>
              <button type="submit" className="btn btn-primary">
                Sign out
              </button>
            </form>
          ) : (
            <Link className="btn btn-primary" href="/team/signin">
              Staff sign-in
            </Link>
          )}
          <Link className="btn" href="/">
            Go to the website
          </Link>
        </>
      }
    />
  );
}
