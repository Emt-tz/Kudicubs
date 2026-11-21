import type { Metadata } from "next";
import { FaqSearch } from "./FaqSearch";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Quick answers for parents: ages, pretend coins, the parent PIN, countries and deleting your family's data.",
};

type SP = Promise<Record<string, string | string[] | undefined>>;

// Canvas: wb-03-faq, wb-04-faq-empty (?q=zzzz). The search runs in the browser; ?q= just pre-fills it.
export default async function FaqPage({ searchParams }: { searchParams: SP }) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  return <FaqSearch initialQuery={q.slice(0, 80)} />;
}
