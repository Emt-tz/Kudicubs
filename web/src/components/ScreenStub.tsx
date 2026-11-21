import { screenTitle } from "@/lib/screens";

/**
 * Placeholder body for a canvas screen. Replace the page's body; keep its file location (the route).
 * `ids[0]` is the screen the URL shows; any others are variants reached by behaviour or ?state=.
 */
export function ScreenStub({ ids, shell = false }: { ids: string[]; shell?: boolean }) {
  const [main, ...variants] = ids;
  return (
    <div className={shell ? "stack" : "container section stack"} data-screen={main}>
      <h1>{screenTitle(main)}</h1>
      <p className="muted">TODO {main}</p>
      {variants.map((id) => (
        <p key={id} className="muted">
          TODO {id} (state: {screenTitle(id)})
        </p>
      ))}
    </div>
  );
}
