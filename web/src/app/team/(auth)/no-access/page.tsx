import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "No access (403)" };

// Canvas: tc-09-no-access. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["tc-09-no-access"]} />;
}
