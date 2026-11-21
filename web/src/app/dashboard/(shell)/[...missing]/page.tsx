import { notFound } from "next/navigation";

// Any unknown /dashboard/... address shows the dashboard's own 404 (dp-27) inside the shell.
export default function Page() {
  notFound();
}
