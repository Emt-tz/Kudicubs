import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Mission detail" };

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

// Canvas: tc-08-mission. Replace the body of this page; the route is this file's location.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Stub only: the nil UUID stands for "does not exist" so the not-found screen can be tested.
  // The real page looks the row up (RLS applies) and calls notFound() when there is none.
  if (id === NIL_UUID) notFound();
  return <ScreenStub ids={["tc-08-mission"]} shell />;
}
