import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Monthly summary" };

// Canvas: dp-23-monthly-summary. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dp-23-monthly-summary"]} shell />;
}
