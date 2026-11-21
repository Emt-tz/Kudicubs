"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Kudi } from "../_components/Kudi";
import { FAQS } from "./questions";

const norm = (s: string) => s.toLowerCase().replace(/[’]/g, "'");

/** Questions that contain every word of the search (in the question or its answer). */
export function filterFaqs(query: string) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return FAQS;
  return FAQS.filter((f) => {
    const hay = norm(`${f.q} ${f.a}`);
    return words.every((w) => hay.includes(w));
  });
}

export function FaqSearch({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const trimmed = query.trim();
  const results = filterFaqs(query);
  const empty = trimmed.length > 0 && results.length === 0;

  function update(next: string) {
    setQuery(next);
    // keep ?q= in the address bar without a navigation, so a search can be shared
    const url = new URL(window.location.href);
    if (next.trim()) url.searchParams.set("q", next.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <div className="ws-wrap ws-wrap-faq" data-screen={empty ? "wb-04-faq-empty" : "wb-03-faq"}>
      <div>
        <h1 className="ws-h1">Frequently asked questions</h1>
        <p className="ws-lead">
          {empty ? (
            "Quick answers for parents."
          ) : (
            <>
              Quick answers for parents. Cannot find yours? <Link href="/contact">Contact us</Link>.
            </>
          )}
        </p>
      </div>

      <div role="search">
        <div className="ws-search-row">
          <div className="field">
            <label htmlFor={`${uid}-s`}>Search the questions</label>
            <input
              id={`${uid}-s`}
              ref={inputRef}
              type="search"
              name="q"
              autoComplete="off"
              placeholder={'Try "PIN" or "real money"'}
              value={query}
              onChange={(e) => update(e.target.value)}
              aria-describedby={`${uid}-count`}
              style={{ borderRadius: 10 }}
            />
          </div>
          {trimmed ? (
            <button
              type="button"
              className="btn btn-sm"
              style={{ alignSelf: "flex-end", minHeight: 48, borderRadius: 999, fontSize: 16, padding: "0 22px" }}
              onClick={() => {
                update("");
                inputRef.current?.focus();
              }}
            >
              Clear search
            </button>
          ) : null}
        </div>
        <p className="sr-only" id={`${uid}-count`} role="status" aria-live="polite">
          {trimmed ? `${results.length} ${results.length === 1 ? "question matches" : "questions match"}` : `${FAQS.length} questions`}
        </p>
      </div>

      {empty ? (
        <div role="status" className="ws-empty">
          <Kudi pose="fist" alt="Kudi" width={130} />
          <h2 style={{ fontSize: 28 }}>No answers for &quot;{trimmed}&quot;</h2>
          <p>Try a shorter word, or clear the search to see every question. KudiCubs has no purchases, so there is nothing to refund.</p>
          <div className="ws-actions" style={{ justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                update("");
                inputRef.current?.focus();
              }}
            >
              Show all questions
            </button>
            <Link className="btn" href="/contact">
              Contact us
            </Link>
          </div>
        </div>
      ) : (
        <div className="ws-faq">
          {results.map((f, i) => (
            <details key={`${f.q}-${trimmed ? "s" : "a"}`} open={trimmed ? true : i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
