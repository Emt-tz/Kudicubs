import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Families" };

// Canvas: tc-02-families, tc-03-families-empty, tc-04-families-loading. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["tc-02-families", "tc-03-families-empty", "tc-04-families-loading"]} shell />;
}
