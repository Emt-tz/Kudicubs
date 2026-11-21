import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Session timed out" };

// Canvas: dp-25-session-timeout. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dp-25-session-timeout"]} />;
}
