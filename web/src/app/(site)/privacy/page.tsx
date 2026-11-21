import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What KudiCubs collects, why, what we never do, how long we keep it and your choices. Includes children's privacy.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "collect",
    title: "What we collect",
    body: (
      <p>
        For each child: a nickname chosen from a list, an age band, a country and their progress in the game. For the parent: an email
        address, used to sign in and to send one-time codes.
      </p>
    ),
  },
  {
    id: "why",
    title: "Why we collect it",
    body: <p>So the game can show the right level, coins and examples, and so a parent can follow progress from their own phone.</p>,
  },
  {
    id: "never",
    title: "What we never do",
    body: (
      <ul>
        <li>No advertising and no third-party tracking on children&apos;s profiles.</li>
        <li>No precise location, contacts or photos.</li>
        <li>No chat between users.</li>
        <li>No real money, and no way to buy anything.</li>
      </ul>
    ),
  },
  {
    id: "children",
    title: "Children's privacy",
    body: (
      <>
        <p>
          Children never sign in with an email and never type their own name: a parent sets up each profile. We keep only a nickname from a
          list, an age band, an avatar, a country and gameplay events, and nothing about a child is shown to other users.
        </p>
        <p style={{ marginTop: 12 }}>
          Coins, XP and badges are a fictional currency (GH₵, ₦ and £ are shown as pretend money only). They have no real-world value, and no
          payment details are ever asked for or stored.
        </p>
      </>
    ),
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: <p>An account with no sign-in or play for 12 months is deleted automatically. We email you 30 days and 7 days before.</p>,
  },
  {
    id: "choices",
    title: "Your choices",
    body: <p>You can export or delete your family&apos;s data at any time from the Parent Dashboard.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions?{" "}
        <Link href="/contact" style={{ fontWeight: 800 }}>
          Contact us
        </Link>
        .
      </p>
    ),
  },
];

// Canvas: wb-12-privacy (children's privacy section is the target of the footer link /privacy#children)
export default function PrivacyPage() {
  return <LegalPage screen="wb-12-privacy" title="Privacy policy" kind="policy" sections={SECTIONS} />;
}
