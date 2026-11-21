import type { Metadata } from "next";
import { ScreenStub } from "@/components/ScreenStub";

export const metadata: Metadata = { title: "Devices and data" };

// Canvas: dash-03-devices-data, dp-19-signout-device-confirm, dp-20-export-ready, dp-21-delete-confirm. Replace the body of this page; the route is this file's location.
export default function Page() {
  return <ScreenStub ids={["dash-03-devices-data", "dp-19-signout-device-confirm", "dp-20-export-ready", "dp-21-delete-confirm"]} shell />;
}
