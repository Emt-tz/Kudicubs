import type { Metadata } from "next";
import Link from "next/link";
import { Kudi } from "./_components/Kudi";

export const metadata: Metadata = {
  title: "Play. Earn. Roar!",
  description:
    "KudiCubs is a play-and-learn app that teaches children aged 4 to 15 how money works. Short missions, a friendly lion cub called Kudi, and pretend coins only.",
};

const BANDS = [
  { tag: "4 to 6", title: "Money & Choices", body: "Pictures and sounds. No reading needed." },
  { tag: "7 to 9", title: "Build & Grow", body: "Short sentences, small businesses and saving goals." },
  { tag: "10 to 12", title: "Founder Mode", body: "Real ideas such as loans and profit, made simple." },
  { tag: "13 to 15", title: "Side Hustle", body: "Trade-offs, goals and smart spending." },
];

// Canvas: web-01-home
export default function HomePage() {
  return (
    <div data-screen="web-01-home">
      <section className="ws-hero">
        <div className="ws-hero-inner">
          <div className="ws-hero-copy">
            <h1>Play. Earn. Roar!</h1>
            <p>
              KudiCubs is a play-and-learn app that teaches children aged 4 to 15 how money works. Short missions, a friendly lion cub
              called Kudi, and pretend coins only.
            </p>
            <Link className="btn btn-primary ws-cta" href="/get-the-app">
              Get the app
            </Link>
          </div>
          <div className="ws-hero-art">
            <Kudi pose="wave" alt="Kudi the Cub holding a gold K coin" width={300} priority />
          </div>
        </div>
      </section>

      <section className="ws-block" aria-labelledby="why">
        <h2 id="why">Why parents like it</h2>
        <div className="ws-grid ws-grid-3">
          <div className="ws-card">
            <h3>Learning by doing</h3>
            <p>
              Children sort coins, run a little stall and make choices. They learn what money is for, how to save it and how to share it, by
              playing.
            </p>
          </div>
          <div className="ws-card">
            <h3>Safe by design</h3>
            <p>No real money, no chatting with strangers, no ads. Settings sit behind a parent gate.</p>
            <Link href="/safety" style={{ fontWeight: 800 }}>
              How we keep children safe
            </Link>
          </div>
          <div className="ws-card">
            <h3>Grows with your child</h3>
            <p>Four age bands, from picture-only play at 4 to a first side hustle at 13. Money examples match where you live.</p>
          </div>
        </div>
      </section>

      <section className="ws-block ws-block-last" aria-labelledby="ages">
        <h2 id="ages">Made for ages 4 to 15</h2>
        <div className="ws-grid ws-grid-4">
          {BANDS.map((b) => (
            <div className="ws-card" key={b.tag}>
              <span className="ws-band-tag">{b.tag}</span>
              <h3 className="ws-band-title">{b.title}</h3>
              <p style={{ margin: 0 }}>{b.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
