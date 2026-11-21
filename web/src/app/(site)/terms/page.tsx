import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Terms" };

// Canvas: wb-13-terms. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["wb-13-terms"]} />;
}
