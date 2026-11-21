import type { Metadata } from "next";
import { demoStatesEnabled } from "@/lib/demo-state";
import { GetApp } from "./GetApp";

export const metadata: Metadata = {
  title: "Get the app",
  description: "Free to try on Android and iPhone. Set KudiCubs up once on your phone and your child can play right away.",
};

type SP = Promise<Record<string, string | string[] | undefined>>;

// Canvas: web-04-get-app, wb-02-get-app-sent (?sent=1 opens the link-sent state directly).
export default async function GetTheAppPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const sent = demoStatesEnabled() && sp.sent === "1";
  return <GetApp initialSentTo={sent ? "parent@example.com" : null} />;
}
