import { SiteFrame } from "@/components/SiteFrame";
import "./site.css";

// Website chrome (header nav + footer). Pages render only their <main> content.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
