import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Child" };

// Canvas: dash-02-child, dp-10-child-no-play. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dash-02-child", "dp-10-child-no-play"]} shell />;
}
