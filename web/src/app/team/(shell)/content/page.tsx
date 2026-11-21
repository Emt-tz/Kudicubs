import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Content" };

// Canvas: team-01-content, tc-07-content-empty. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["team-01-content", "tc-07-content-empty"]} shell />;
}
