import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Activity" };

// Canvas: dp-12-activity. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dp-12-activity"]} shell />;
}
