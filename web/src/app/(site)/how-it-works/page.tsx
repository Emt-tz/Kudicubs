import type { Metadata } from "next";
import Link from "next/link";
import { Kudi } from "../_components/Kudi";

export const metadata: Metadata = {
  title: "How it works",
  description: "Short missions, one choice at a time, and a friendly lion cub to guide the way.",
};

const STEPS = [
  { title: "Play a mission", body: "Each mission is a little story, such as a lost-coins market walk. Children touch, sort and decide." },
  { title: "See what happens", body: "Every choice has a visible result. Save a coin and the jar grows. Price a snack too high and fewer friends buy it." },
  { title: "Grow and earn", body: "Pretend coins, XP and badges mark progress. Nothing earned is ever taken away." },
];

const SKILLS = [
  { name: "Know", body: "What money is and what it is for." },
  { name: "Understand", body: "Why prices, costs and choices matter." },
  { name: "Decide", body: "Weigh choices and live with the result." },
  { name: "Invest", body: "Put effort and coins to work over time." },
  { name: "Share", body: "Give, help and enjoy doing it." },
];

// Canvas: wb-01-how-it-works
export default function HowItWorksPage() {
  return (
    <div className="ws-wrap" data-screen="wb-01-how-it-works" style={{ gap: 36 }}>
      <div>
        <h1 className="ws-h1">How KudiCubs works</h1>
        <p className="ws-lead">Short missions, one choice at a time, and a friendly lion cub to guide the way.</p>
      </div>
      <ol className="ws-steps">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className="ws-step-n" aria-hidden="true">
              {i + 1}
            </span>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>
      <section className="ws-panel-gold" aria-labelledby="rewards">
        <div className="ws-grow">
          <h2 id="rewards">Rewards that mean something</h2>
          <p>Coins, XP, badges and levels celebrate effort. They are fictional and cannot be bought, sold or turned into real money.</p>
        </div>
        <Kudi pose="celebrate" alt="Kudi celebrating" width={190} />
      </section>
      <section aria-labelledby="skills">
        <h2 id="skills" className="ws-section-title">
          Five skills that grow together
        </h2>
        <div className="ws-grid ws-grid-skills">
          {SKILLS.map((s) => (
            <div className="ws-card-soft ws-skill" key={s.name}>
              <strong>{s.name}</strong>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>
      <div>
        <Link className="btn btn-primary ws-cta" href="/get-the-app">
          Get the app
        </Link>
      </div>
    </div>
  );
}
