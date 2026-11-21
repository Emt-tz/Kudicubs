import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Family settings" };

// Canvas: dp-17-settings-family, dp-18-pin-change-error. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dp-17-settings-family", "dp-18-pin-change-error"]} shell />;
}
