import type { Metadata } from "next";
import Link from "next/link";
import { Kudi } from "../_components/Kudi";

export const metadata: Metadata = {
  title: "Safety",
  description: "Plain answers to what parents ask first: a grown-up gate and PIN, no real money, no chat, no ads and no tracking.",
};

const POINTS = [
  {
    title: "A grown-up gate and a PIN",
    body: "Settings, account changes and anything outside the game sit behind a gate a young child cannot pass by chance, then your own PIN.",
  },
  { title: "No real money", body: "Coins are pretend. They cannot be bought, sold or turned into real money, and children cannot make purchases." },
  { title: "No chatting with strangers", body: "There is no open chat and nothing children type is shown to other users. Names come from a short list." },
  { title: "Only what the game needs", body: "A nickname, an age band, a country and progress. No precise location, contacts or photos." },
  { title: "No ads, no tracking", body: "No advertising and no third-party tracking on children's profiles." },
  { title: "Mistakes are safe", body: "Under 7s never see a failure screen. Older children can always try again and never lose what they have earned." },
];

// Canvas: web-03-safety
export default function SafetyPage() {
  return (
    <div className="ws-wrap" data-screen="web-03-safety">
      <div className="ws-hero-row">
        <div className="ws-grow">
          <h1 className="ws-h1">How we keep children safe</h1>
          <p className="ws-lead" style={{ maxWidth: "60ch" }}>
            Plain answers to what parents ask first. The grown-up area is for you, and the game is for them.
          </p>
        </div>
        <Kudi pose="headphones" alt="Kudi wearing headphones" width={200} />
      </div>
      <div className="ws-grid ws-grid-safety">
        {POINTS.map((p) => (
          <article className="ws-card" key={p.title} style={{ padding: 22 }}>
            <h2 style={{ fontSize: 24 }}>{p.title}</h2>
            <p>{p.body}</p>
          </article>
        ))}
      </div>
      <div className="ws-actions">
        <Link className="btn btn-primary ws-cta" href="/privacy">
          Read the privacy policy
        </Link>
        <Link className="btn ws-cta" href="/privacy#children">
          Children&apos;s privacy
        </Link>
      </div>
    </div>
  );
}
