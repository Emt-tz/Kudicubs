import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Enter code" };

// Canvas: dp-04-code, dp-05-code-error, dp-06-code-expired. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dp-04-code", "dp-05-code-error", "dp-06-code-expired"]} />;
}
