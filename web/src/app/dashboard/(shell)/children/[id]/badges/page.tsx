import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Badges" };

// Canvas: dp-13-badges. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dp-13-badges"]} shell />;
}
