import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Skills" };

// Canvas: dp-11-skills. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dp-11-skills"]} shell />;
}
