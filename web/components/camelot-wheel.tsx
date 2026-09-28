import { camelotNeighbors } from "@/lib/camelot";
import type { CamelotLabel, Mode } from "@/lib/types";

const LABEL_TONE: Record<CamelotLabel, string> = {
  "Same key": "bg-gold/15 text-gold",
  Adjacent: "bg-gold/10 text-cream",
  Relative: "bg-mint/15 text-mint",
  "Energy boost": "bg-boost/15 text-boost",
  "Energy drop": "bg-drop/15 text-drop",
};

function polar(n: number, radius: number) {
  const angle = ((n % 12) * 30 - 90) * (Math.PI / 180);
  return {
    x: 140 + radius * Math.cos(angle),
    y: 140 + radius * Math.sin(angle),
  };
}

export function CamelotBadge({
  camelot,
  label,
}: {
  camelot: string | null;
  label: CamelotLabel | null;
}) {
  if (!camelot) {
    return <span className="text-sm text-muted">Key unknown</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        label ? LABEL_TONE[label] : "bg-white/5 text-cream"
      }`}
    >
      <span className="tabular-nums">{camelot}</span>
      {label ? <span>{label}</span> : null}
    </span>
  );
}

export function CamelotWheel({
  camelot,
  mode,
  harmonic,
}: {
  camelot: string | null;
  mode: Mode;
  harmonic: boolean;
}) {
  const query = camelot?.trim().toUpperCase() ?? null;
  const neighbors = query ? camelotNeighbors(query, mode) : {};
  const description = Object.entries(neighbors)
    .map(([key, label]) => `${key} ${label}`)
    .join(", ");

  return (
    <figure className="rounded-xl border border-line bg-panel p-4">
      <figcaption className="mb-3 flex items-baseline justify-between gap-3">
        <span className="font-display text-base text-cream">Camelot wheel</span>
        <span className="text-xs text-muted">A inside, B outside</span>
      </figcaption>
      <svg
        viewBox="0 0 280 280"
        role="img"
        aria-labelledby="wheel-title wheel-desc"
        className="mx-auto w-full max-w-64"
      >
        <title id="wheel-title">Camelot wheel</title>
        <desc id="wheel-desc">
          {query
            ? `Selected key ${query}. Suggested keys: ${description || "none"}.`
            : "No Camelot key for this track."}
        </desc>
        <circle cx="140" cy="140" r="128" fill="#101217" stroke="#31353f" />
        <circle cx="140" cy="140" r="90" fill="none" stroke="#31353f" />
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) =>
          (["A", "B"] as const).map((letter) => {
            const key = `${n}${letter}`;
            const point = polar(n, letter === "A" ? 68 : 110);
            const isQuery = key === query;
            const suggested = key in neighbors && !isQuery;
            return (
              <g key={key}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="16"
                  fill={isQuery ? "#f0b429" : suggested ? "#2a2416" : "#1c1f26"}
                  stroke={suggested ? "#f0b429" : "transparent"}
                  strokeWidth="2"
                />
                <text
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isQuery ? "#1c1506" : "#f6f1e6"}
                  fontSize="9"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {key}
                </text>
              </g>
            );
          }),
        )}
        <text
          x="140"
          y="136"
          textAnchor="middle"
          fill="#f6f1e6"
          fontSize="18"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {query ?? "—"}
        </text>
        <text
          x="140"
          y="156"
          textAnchor="middle"
          fill="#b7b1a6"
          fontSize="9"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          this track
        </text>
      </svg>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gold" />
          This track
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full border border-gold" />
          Suggested
        </li>
      </ul>
      {query && !harmonic ? (
        <p className="mt-3 text-xs text-muted">
          Harmonic filter is off, so these keys are shown and not applied.
        </p>
      ) : null}
      {!query ? (
        <p className="mt-3 text-sm text-muted">No Camelot key for this track.</p>
      ) : null}
    </figure>
  );
}
