import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Child settings" };

// Canvas: dp-14-settings-child, dp-15-settings-saved, dp-16-settings-error. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dp-14-settings-child", "dp-15-settings-saved", "dp-16-settings-error"]} shell />;
}
