"use client";

import type { Mode, TolPct } from "@/lib/types";

const INTENTS: { value: Mode; label: string }[] = [
  { value: "keep", label: "Keep" },
  { value: "boost", label: "Boost energy" },
  { value: "drop", label: "Drop energy" },
];

const TOLERANCES: TolPct[] = [3, 6];

function Choice({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`cursor-pointer rounded-md px-3 py-2 text-sm ${
        checked ? "bg-gold text-gold-ink" : "text-cream hover:bg-white/5"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  );
}

export function Controls({
  mode,
  tolPct,
  harmonic,
  onMode,
  onTol,
  onHarmonic,
}: {
  mode: Mode;
  tolPct: TolPct;
  harmonic: boolean;
  onMode: (mode: Mode) => void;
  onTol: (tolPct: TolPct) => void;
  onHarmonic: (harmonic: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <fieldset className="min-w-0 border-0 p-0">
        <legend className="mb-2 text-sm text-muted">Intent</legend>
        <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-panel-2 p-1">
          {INTENTS.map((intent) => (
            <Choice
              key={intent.value}
              name="intent"
              value={intent.value}
              label={intent.label}
              checked={mode === intent.value}
              onChange={() => onMode(intent.value)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0 border-0 p-0">
        <legend className="mb-2 text-sm text-muted">BPM tolerance</legend>
        <div className="flex gap-1 rounded-lg border border-line bg-panel-2 p-1">
          {TOLERANCES.map((value) => (
            <Choice
              key={value}
              name="bpm-tolerance"
              value={String(value)}
              label={`${value}%`}
              checked={tolPct === value}
              onChange={() => onTol(value)}
            />
          ))}
        </div>
      </fieldset>

      <label className="inline-flex cursor-pointer items-center gap-3 pb-1">
        <input
          type="checkbox"
          role="switch"
          checked={harmonic}
          onChange={(event) => onHarmonic(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative block h-6 w-11 rounded-full bg-[#2c3038] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-cream after:transition after:content-[''] peer-checked:bg-gold peer-checked:after:translate-x-5 peer-checked:after:bg-gold-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold"
        />
        <span className="text-sm text-cream">Harmonic filter</span>
      </label>
    </div>
  );
}
