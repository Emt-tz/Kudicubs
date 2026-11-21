"use client";

import { useEffect, useState } from "react";

/** "On this page" list. Marks the section being read (aria-current) as the page scrolls or the hash changes. */
export function Toc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if (h && items.some((i) => i.id === h)) setActive(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);

    const targets = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "0px 0px -65% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => {
      window.removeEventListener("hashchange", fromHash);
      io.disconnect();
    };
  }, [items]);

  return (
    <nav aria-label="On this page" className="ws-toc">
      <div className="ws-toc-title">On this page</div>
      {items.map((i) => (
        <a key={i.id} href={`#${i.id}`} aria-current={active === i.id ? "true" : undefined}>
          {i.label}
        </a>
      ))}
    </nav>
  );
}
