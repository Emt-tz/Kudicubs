import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Home" };

// Canvas: web-01-home. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["web-01-home"]} />;
}
