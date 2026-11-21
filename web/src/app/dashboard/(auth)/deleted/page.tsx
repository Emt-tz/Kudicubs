import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Data deleted" };

// Canvas: dp-22-deleted. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dp-22-deleted"]} />;
}
