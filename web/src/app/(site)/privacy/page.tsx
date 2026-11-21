import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Privacy" };

// Canvas: wb-12-privacy. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["wb-12-privacy"]} />;
}
