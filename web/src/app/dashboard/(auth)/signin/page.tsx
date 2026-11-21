import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Sign in" };

// Canvas: dp-01-signin, dp-02-signin-error, dp-03-signin-loading. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dp-01-signin", "dp-02-signin-error", "dp-03-signin-loading"]} />;
}
