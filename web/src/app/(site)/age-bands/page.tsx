import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Age bands" };

// Canvas: web-02-age-bands. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["web-02-age-bands"]} />;
}
