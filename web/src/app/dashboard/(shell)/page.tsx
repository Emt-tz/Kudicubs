import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Overview" };

// Canvas: dash-01-overview, dp-07-overview-loading, dp-08-overview-empty, dp-09-overview-error. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dash-01-overview", "dp-07-overview-loading", "dp-08-overview-empty", "dp-09-overview-error"]} shell />;
}
