import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Contact" };

// Canvas: wb-05-contact, wb-06-contact-error, wb-07-contact-sending, wb-08-contact-sent. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["wb-05-contact", "wb-06-contact-error", "wb-07-contact-sending", "wb-08-contact-sent"]} />;
}
