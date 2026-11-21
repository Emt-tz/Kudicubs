import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Family sign-in" };

// Canvas: wb-09-signin, wb-10-signin-error, wb-11-signin-sending. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["wb-09-signin", "wb-10-signin-error", "wb-11-signin-sending"]} />;
}
