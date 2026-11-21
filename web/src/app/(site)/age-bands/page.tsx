import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Age bands",
  description:
    "Every KudiCubs age band has the same structure and a different level of challenge: 4 to 6, 7 to 9, 10 to 12 and 13 to 15.",
};

const BANDS = [
  {
    tag: "Ages 4 to 6",
    title: "Money & Choices",
    body: "Pictures and sounds, no reading needed. Children find, sort and count coins, then choose to save or spend.",
    example: "Example: The Lost Coins.",
  },
  {
    tag: "Ages 7 to 9",
    title: "Build & Grow",
    body: "Short sentences and two things to weigh at once, such as planning a party on a budget. A try-again button is always there.",
    example: "Example: Birthday Party budget.",
  },
  {
    tag: "Ages 10 to 12",
    title: "Founder Mode",
    body: "More choices at once: a loan, an investor or savings. Children see how each choice changes the outcome.",
    example: "Example: Clothing Brand funding.",
  },
  {
    tag: "Ages 13 to 15",
    title: "Side Hustle",
    body: "Cost, price and profit with a small budget. Real-feeling trade-offs, always with pretend coins.",
    example: "Example: Side Hustle first sale.",
  },
];

const COUNTRIES = ["Ghana · cedi (GH₵)", "Nigeria · naira (₦)", "United Kingdom · pound (£)"];

// Canvas: web-02-age-bands
export default function AgeBandsPage() {
  return (
    <div className="ws-wrap" data-screen="web-02-age-bands">
      <div>
        <h1 className="ws-h1">One game that grows with your child</h1>
        <p className="ws-lead">
          Every age band has the same structure and a different level of challenge. A parent sets the band and can change it at any time.
        </p>
      </div>
      <div className="ws-grid ws-grid-4">
        {BANDS.map((b) => (
          <article className="ws-card ws-card-flex" key={b.tag}>
            <span className="ws-band-tag" style={{ alignSelf: "flex-start", padding: "2px 14px", fontSize: "inherit" }}>
              {b.tag}
            </span>
            <h2 style={{ fontSize: 28 }}>{b.title}</h2>
            <p>{b.body}</p>
            <p className="ws-small">{b.example}</p>
          </article>
        ))}
      </div>
      <section className="ws-panel-peach" aria-labelledby="home-money">
        <h2 id="home-money" style={{ fontSize: 26 }}>
          Money that looks like home
        </h2>
        <p style={{ maxWidth: "70ch" }}>
          Coins and examples follow where your family lives. Pick a country in the parent area and the game changes with it.
        </p>
        <ul className="row" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {COUNTRIES.map((c) => (
            <li className="ws-pill" key={c}>
              {c}
            </li>
          ))}
        </ul>
      </section>
      <div>
        <Link className="btn btn-primary ws-cta" href="/get-the-app">
          Get the app
        </Link>
      </div>
    </div>
  );
}
