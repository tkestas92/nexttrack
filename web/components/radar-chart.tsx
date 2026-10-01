"use client";

import { useId, useState } from "react";
import { biggestDifference, RADAR_AXES, similarAxes, usableRadar } from "@/lib/radar";

const CX = 200;
const CY = 188;
const RADIUS = 90;

type Series = {
  values: number[];
  name: string;
  stroke: string;
  fill: string;
};

function polar(index: number, radius: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / RADAR_AXES.length;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
    angle,
  };
}

function ringPoints(level: number) {
  return RADAR_AXES.map((_, index) => {
    const spot = polar(index, (level / 100) * RADIUS);
    return `${spot.x.toFixed(1)},${spot.y.toFixed(1)}`;
  }).join(" ");
}

function shape(values: number[]) {
  return values
    .map((value, index) => {
      const amount = Math.min(100, Math.max(0, value));
      const spot = polar(index, (amount / 100) * RADIUS);
      return `${spot.x.toFixed(1)},${spot.y.toFixed(1)}`;
    })
    .join(" ");
}

function describe(series: Series[]) {
  return series
    .map((item) => {
      const axes = RADAR_AXES.map(
        (axis, index) => `${axis.label} ${Math.round(item.values[index])}`,
      ).join(", ");
      return `${item.name}: ${axes}.`;
    })
    .join(" ");
}

export function RadarChart({ series }: { series: Series[] }) {
  const titleId = useId();
  const descId = useId();
  if (series.length === 0) return null;

  return (
    <figure className="mt-4">
      <svg
        viewBox="0 0 400 376"
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className="mx-auto w-full max-w-72"
      >
        <title id={titleId}>
          {series.length > 1 ? "Mood radar comparison" : "Mood radar"}
        </title>
        <desc id={descId}>{describe(series)}</desc>
        {[25, 50, 75, 100].map((ring) => (
          <polygon key={ring} points={ringPoints(ring)} fill="none" stroke="#31353f" />
        ))}
        {RADAR_AXES.map((axis, index) => {
          const end = polar(index, RADIUS);
          const label = polar(index, RADIUS + 34);
          const cosine = Math.cos(end.angle);
          const sine = Math.sin(end.angle);
          const anchor = cosine > 0.35 ? "start" : cosine < -0.35 ? "end" : "middle";
          const dy = sine < -0.35 ? 0 : sine > 0.35 ? 12 : 4;
          return (
            <g key={axis.id}>
              <line x1={CX} y1={CY} x2={end.x} y2={end.y} stroke="#31353f" />
              <text
                x={label.x}
                y={label.y}
                dy={dy}
                textAnchor={anchor}
                fill="#b7b1a6"
                fontSize="12"
              >
                {axis.label}
              </text>
            </g>
          );
        })}
        {series.map((item) => (
          <polygon
            key={item.name}
            points={shape(item.values)}
            fill={item.fill}
            stroke={item.stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      {series.length > 1 ? (
        <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
          {series.map((item) => (
            <li key={item.name} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: item.stroke }}
              />
              {item.name}
            </li>
          ))}
        </ul>
      ) : null}
      <figcaption className="mt-2 text-center text-xs leading-relaxed text-muted">
        Audio-model estimates (Essentia), relative to this library.
      </figcaption>
    </figure>
  );
}

const SELECTED: Pick<Series, "name" | "stroke" | "fill"> = {
  name: "Selected",
  stroke: "#f0b429",
  fill: "rgba(240, 180, 41, 0.28)",
};

const SUGGESTION: Pick<Series, "name" | "stroke" | "fill"> = {
  name: "Suggestion",
  stroke: "#8fd0be",
  fill: "rgba(143, 208, 190, 0.22)",
};

export function TrackRadar({ radar }: { radar: number[] | null }) {
  const values = usableRadar(radar);
  if (!values) return null;
  return <RadarChart series={[{ ...SELECTED, values }]} />;
}

export function RadarCompare({
  query,
  suggestion,
}: {
  query: number[] | null;
  suggestion: number[] | null;
}) {
  const left = usableRadar(query);
  const right = usableRadar(suggestion);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  if (!left || !right) return null;

  const similar = similarAxes(left, right, 12) ?? [];
  const gap = biggestDifference(left, right);
  const summary = `Similar: ${similar.length > 0 ? similar.join(", ") : "none"}. Differs most: ${gap}.`;

  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="rounded-md border border-line px-3 py-1.5 text-[12px] text-muted transition hover:border-[#444] hover:text-cream"
      >
        Compare
      </button>
      {open ? (
        <div id={panelId}>
          <RadarChart
            series={[
              { ...SELECTED, values: left },
              { ...SUGGESTION, values: right },
            ]}
          />
          <p className="text-center text-sm text-cream">{summary}</p>
        </div>
      ) : null}
    </div>
  );
}
