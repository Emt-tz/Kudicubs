import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using KudiCubs: parents and children, pretend coins, your account and changes to these terms.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "using",
    title: "Using KudiCubs",
    body: <p>KudiCubs is a learning game about money for children aged 4 to 15. [Terms text to come.]</p>,
  },
  {
    id: "parents",
    title: "Parents and children",
    body: <p>A parent or carer sets up the family, chooses each child&apos;s age band and keeps the parent PIN private. [Terms text to come.]</p>,
  },
  {
    id: "coins",
    title: "Pretend coins",
    body: (
      <p>
        Coins, XP and badges are part of the game. They have no real-world value and cannot be exchanged for money. The currencies shown
        (GH₵, ₦ and £) are fictional game money, and no real payment is ever taken. [Terms text to come.]
      </p>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: <p>You can export or delete your family&apos;s data at any time from the Parent Dashboard. [Terms text to come.]</p>,
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: <p>We will tell parents by email before important changes take effect. [Terms text to come.]</p>,
  },
];

// Canvas: wb-13-terms
export default function TermsPage() {
  return <LegalPage screen="wb-13-terms" title="Terms of use" kind="terms" sections={SECTIONS} />;
}
