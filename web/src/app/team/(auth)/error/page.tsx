import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Server error" };

// Canvas: tc-10-error. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["tc-10-error"]} />;
}
