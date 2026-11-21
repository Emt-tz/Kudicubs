import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "How it works" };

// Canvas: wb-01-how-it-works. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["wb-01-how-it-works"]} />;
}
