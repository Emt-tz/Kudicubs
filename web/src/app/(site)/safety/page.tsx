import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Safety" };

// Canvas: web-03-safety. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["web-03-safety"]} />;
}
