"use client";

import { usePreview } from "./preview-provider";

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M6.5 4.8v10.4L15.5 10 6.5 4.8Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M6 4.5h2.6v11H6v-11Zm5.4 0H14v11h-2.6v-11Z" />
    </svg>
  );
}

export function PreviewControls({ id, label }: { id: number; label: string }) {
  const { activeId, phase, error, toggle } = usePreview();
  const active = activeId === id;
  const playing = active && phase === "playing";
  const loading = active && phase === "loading";
  const message = active && phase === "error" ? error : null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={() => toggle(id)}
        disabled={loading}
        aria-pressed={playing}
        aria-busy={loading}
        aria-label={
          playing ? `Pause preview of ${label}` : `Play preview of ${label}`
        }
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-gold-ink transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-ink/30 border-t-gold-ink" />
        ) : playing ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </button>
      <a
        href={`https://www.deezer.com/track/${id}`}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-gold underline-offset-4 hover:underline"
      >
        Preview via Deezer
      </a>
      {message ? (
        <p role="alert" className="basis-full text-sm text-boost">
          {message}
        </p>
      ) : null}
    </div>
  );
}
