import type { ReactNode } from "react";
import { WarnIcon } from "./icons";
import { Toc } from "./Toc";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Privacy / terms layout: "On this page" list, placeholder notice, title and sections. */
export function LegalPage({
  screen,
  title,
  kind,
  sections,
}: {
  screen: string;
  title: string;
  kind: "policy" | "terms";
  sections: LegalSection[];
}) {
  return (
    <div className="ws-legal" data-screen={screen}>
      <Toc items={sections.map((s) => ({ id: s.id, label: s.title }))} />
      <article className="ws-doc">
        <div role="note" className="ws-note">
          <WarnIcon />
          <div>
            <strong>Placeholder text, pending legal review.</strong> This page shows the layout only. It is not the final {kind}.
          </div>
        </div>
        <h1 className="ws-h1" style={{ marginBottom: 6 }}>
          {title}
        </h1>
        <p className="ws-sub" style={{ marginBottom: 24 }}>
          Last updated: [DATE]
        </p>
        {sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}>
            <h2 id={`${s.id}-h`}>{s.title}</h2>
            {s.body}
          </section>
        ))}
      </article>
    </div>
  );
}
