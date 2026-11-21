import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Signed out" };

// Canvas: tc-11-signed-out. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["tc-11-signed-out"]} />;
}
