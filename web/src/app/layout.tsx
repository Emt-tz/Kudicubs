import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/styles/tokens.css";
import "@/styles/globals.css";

// Bundled woff2 (no runtime CDN): Baloo 2 for titles and buttons, Nunito for text.
const baloo = localFont({
  src: "../fonts/Baloo2-Variable.woff2",
  weight: "600 800",
  variable: "--font-baloo",
  display: "swap",
});
const nunito = localFont({
  src: "../fonts/Nunito-Variable.woff2",
  weight: "400 800",
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "KudiCubs", template: "%s | KudiCubs" },
  description:
    "KudiCubs is a play-and-learn app that teaches children aged 4 to 15 how money works. Pretend coins only.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
