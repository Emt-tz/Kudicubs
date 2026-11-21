import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "FAQ" };

// Canvas: wb-03-faq, wb-04-faq-empty. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["wb-03-faq", "wb-04-faq-empty"]} />;
}
