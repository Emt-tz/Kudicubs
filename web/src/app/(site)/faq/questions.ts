export type Faq = { q: string; a: string };

/** Written answers for the website FAQ. Keep them consistent with the Safety, Privacy and Age bands pages. */
export const FAQS: Faq[] = [
  {
    q: "What ages is KudiCubs for?",
    a: "Children aged 4 to 15. There are four age bands (4–6, 7–9, 10–12 and 13–15), and a parent can change a child's band at any time.",
  },
  {
    q: "Is any real money involved?",
    a: "No. Coins, XP and badges are pretend. They cannot be bought, sold or turned into real money, and children cannot make purchases.",
  },
  {
    q: "What is the parent PIN for?",
    a: "The PIN protects the parent area on the phone. Settings and account changes sit behind a grown-up gate and then your own PIN, so a child cannot change them by accident. Too many wrong tries lock the PIN for a short while.",
  },
  {
    q: "Does my child need to read?",
    a: "Not for ages 4 to 6: that band uses pictures and sounds. Older bands use short sentences that grow a little longer with each band.",
  },
  {
    q: "Can I use it in Ghana, Nigeria or the UK?",
    a: "Yes. Pick your country in the parent area and the pretend coins and examples follow it: cedi (GH₵), naira (₦) or pound (£).",
  },
  {
    q: "How do I delete my family's data?",
    a: "Sign in to the Parent Dashboard, open Devices and data, and choose export or delete. Deleting removes your family's children, progress and settings for good, so export first if you want a copy.",
  },
];
