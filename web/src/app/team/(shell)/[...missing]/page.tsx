import { notFound } from "next/navigation";

// Any unknown /team/... address shows the console's not-found inside the shell.
export default function Page() {
  notFound();
}
