// Charts drawn as inline SVG (no chart library). Colours follow the dashboard canvas.

const ORANGE = "#F68C1F";
const BROWN = "#3E2312";
const GOLD = "#FBAA19";
const GRID = "#F0E4CE";
const MUTED = "#644D3B";

/** Tiny trend line for KPI tiles. */
export function Sparkline({ values, width = 96, height = 36 }: { values: number[]; width?: number; height?: number }) {
  const pts = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min;
  const pad = 4;
  const points = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * width;
      const y = span === 0 ? height / 2 : height - pad - ((v - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Y-axis maximum and four tick values (0, 1/3, 2/3, 1) for a bar chart. */
export function niceMax(max: number, step = 15): number {
  return Math.max(step, Math.ceil(max / step) * step);
}

export function BarChart({
  values,
  labels,
  yMax,
  ariaLabel,
  highlightLast = true,
  w = 800,
  h = 220,
}: {
  values: number[];
  labels: string[];
  yMax: number;
  ariaLabel: string;
  highlightLast?: boolean;
  w?: number;
  h?: number;
}) {
  const left = 44;
  const right = w - 10;
  const top = 20;
  const bottom = h - 50;
  const plotH = bottom - top;
  const n = values.length;
  const slot = (right - left) / n;
  const barW = Math.min(44, slot * 0.5);
  const showValues = n <= 14;
  const labelEvery = n <= 10 ? 1 : Math.ceil(n / 7);
  const ticks = [0, 1, 2, 3].map((i) => Math.round((yMax / 3) * i));
  const yOf = (v: number) => bottom - (Math.min(v, yMax) / yMax) * plotH;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={ariaLabel} style={{ display: "block" }}>
      <g stroke={GRID}>
        {ticks.map((t) => (
          <line key={t} x1={left} y1={yOf(t)} x2={right} y2={yOf(t)} />
        ))}
      </g>
      <g fontFamily="Nunito, sans-serif" fontSize="12" fill={MUTED}>
        {ticks.map((t) => (
          <text key={t} x={left - 8} y={yOf(t) + 4} textAnchor="end">
            {t}
          </text>
        ))}
        {labels.map((l, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={i} x={left + slot * i + slot / 2} y={h - 20} textAnchor="middle" fontWeight={i === n - 1 && highlightLast ? 800 : 400} fill={i === n - 1 && highlightLast ? BROWN : MUTED}>
              {l}
            </text>
          ) : null,
        )}
      </g>
      {values.map((v, i) => {
        const x = left + slot * i + (slot - barW) / 2;
        const y = yOf(v);
        const last = highlightLast && i === n - 1;
        return v > 0 ? (
          <rect key={i} x={x} y={y} width={barW} height={bottom - y} rx={6} fill={last ? BROWN : ORANGE} />
        ) : (
          <rect key={i} x={x} y={bottom - 2} width={barW} height={2} fill={last ? BROWN : ORANGE} />
        );
      })}
      {showValues ? (
        <g fontFamily="Nunito, sans-serif" fontSize="12" fontWeight="800" fill={BROWN}>
          {values.map((v, i) => (
            <text key={i} x={left + slot * i + slot / 2} y={yOf(v) - 6} textAnchor="middle">
              {v}
            </text>
          ))}
        </g>
      ) : null}
    </svg>
  );
}

export type LineSeries = { name: string; values: number[]; colour: string; dash?: string };
export const SERIES_STYLES: { colour: string; dash?: string }[] = [
  { colour: ORANGE },
  { colour: BROWN, dash: "8 5" },
  { colour: GOLD, dash: "2 5" },
];

export function LineChart({ series, ariaLabel, xLabel }: { series: LineSeries[]; ariaLabel: string; xLabel: (index: number) => string }) {
  const w = 560;
  const h = 240;
  const left = 40;
  const right = 520;
  const top = 20;
  const bottom = 220;
  const n = Math.max(2, series[0]?.values.length ?? 2);
  const xOf = (i: number) => left + (i / (n - 1)) * (right - left);
  const yOf = (v: number) => bottom - (Math.min(100, Math.max(0, v)) / 100) * (bottom - top);
  const xTicks = Array.from(new Set([0, Math.floor((n - 1) / 3), Math.floor(((n - 1) * 2) / 3), n - 1]));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={ariaLabel} style={{ display: "block" }}>
      <g stroke={GRID} strokeWidth="1">
        {[0, 25, 50, 75, 100].map((t) => (
          <line key={t} x1={left} y1={yOf(t)} x2={550} y2={yOf(t)} />
        ))}
      </g>
      <g fontFamily="Nunito, sans-serif" fontSize="12" fill={MUTED}>
        {[0, 25, 50, 75, 100].map((t) => (
          <text key={t} x={left - 8} y={yOf(t) + 4} textAnchor="end">
            {t}%
          </text>
        ))}
        {xTicks.map((i) => (
          <text key={i} x={xOf(i)} y={238} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>
            {xLabel(i)}
          </text>
        ))}
      </g>
      {series.map((s) => (
        <polyline
          key={s.name}
          points={s.values.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ")}
          fill="none"
          stroke={s.colour}
          strokeWidth="3"
          strokeDasharray={s.dash}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {series.map((s) => (
        <circle key={s.name} cx={xOf(s.values.length - 1)} cy={yOf(s.values[s.values.length - 1] ?? 0)} r="5" fill={s.colour} />
      ))}
    </svg>
  );
}

export function LegendLine({ colour, dash }: { colour: string; dash?: string }) {
  return (
    <svg width="28" height="8" aria-hidden="true">
      <line x1="0" y1="4" x2="28" y2="4" stroke={colour} strokeWidth="3" strokeDasharray={dash} />
    </svg>
  );
}
