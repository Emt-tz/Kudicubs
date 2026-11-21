import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Get the app" };

// Canvas: web-04-get-app, wb-02-get-app-sent. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["web-04-get-app", "wb-02-get-app-sent"]} />;
}
