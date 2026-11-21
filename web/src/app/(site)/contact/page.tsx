import type { Metadata } from "next";
import { getDemoVariant } from "@/lib/demo-state";
import { ContactView, type ContactDemo } from "./ContactView";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions about KudiCubs, safety or your family's data? Send us a message and we will reply within two working days.",
};

type SP = Promise<Record<string, string | string[] | undefined>>;

// Canvas: wb-05-contact, wb-06-contact-error, wb-07-contact-sending, wb-08-contact-sent (?state=error|sending|sent opens a variant).
export default async function ContactPage({ searchParams }: { searchParams: SP }) {
  const demo = getDemoVariant(await searchParams, ["error", "sending", "sent"] as const) as ContactDemo | null;
  return <ContactView demo={demo} />;
}
