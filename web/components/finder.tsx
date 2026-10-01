"use client";

import { useEffect, useMemo, useState } from "react";
import { CamelotBadge, CamelotWheel } from "@/components/camelot-wheel";
import { Controls } from "@/components/controls";
import { PreviewControls } from "@/components/preview-controls";
import { RadarCompare, TrackRadar } from "@/components/radar-chart";
import { PreviewProvider } from "@/components/preview-provider";
import { TrackSearch } from "@/components/track-search";
import { formatBpm, trackLabel } from "@/lib/format";
import { loadLibrary } from "@/lib/library";
import { rank, scorePercent } from "@/lib/rank";
import type { Library, Mode, TolPct, Track } from "@/lib/types";

function deezerId(track: Track): number | null {
  return typeof track.deezer === "number" &&
    Number.isInteger(track.deezer) &&
    track.deezer > 0
    ? track.deezer
    : null;
}

function TrackFacts({ track }: { track: Track }) {
  const bits = [
    track.bpm == null ? "BPM unknown" : `${formatBpm(track.bpm)} BPM`,
    track.camelot ?? "Key unknown",
    track.genre.trim() || "Genre unknown",
  ];
  return <p className="text-sm text-muted">{bits.join(" · ")}</p>;
}

function SimilarityBar({ score }: { score: number }) {
  const percent = scorePercent(score);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-muted">Similarity</span>
        <span className="tabular-nums text-cream">{percent}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-white/10"
        role="img"
        aria-label={`Similarity ${percent} percent`}
      >
        <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function Finder() {
  const [library, setLibrary] = useState<Library | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("keep");
  const [tolPct, setTolPct] = useState<TolPct>(6);
  const [harmonic, setHarmonic] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadLibrary()
      .then((next) => {
        if (!cancelled) {
          setLibrary(next);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLibrary(null);
          setError(
            err instanceof Error ? err.message : "The library could not be loaded.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const selected = library && query != null ? library.tracks[query] : null;
  const ranked = useMemo(() => {
    if (!library || query == null) return [];
    return rank(query, { mode, tolPct, harmonic }, library);
  }, [library, query, mode, tolPct, harmonic]);

  return (
    <section id="finder" aria-labelledby="finder-heading" className="flex flex-col gap-6">
      <h2 id="finder-heading" className="sr-only">
        Find the next track
      </h2>

      {!library && !error ? (
        <div
          role="status"
          className="rounded-xl border border-line bg-panel px-5 py-8"
        >
          <p className="font-display text-xl text-cream">Loading the library…</p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Downloading embeddings and metadata. This is a few megabytes and happens once.
          </p>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-gold" />
          </div>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="rounded-xl border border-boost/40 bg-panel px-5 py-8">
          <p className="font-display text-xl text-cream">The library didn’t load.</p>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAttempt((value) => value + 1);
            }}
            className="mt-5 rounded-md bg-gold px-4 py-2 text-sm font-medium text-gold-ink"
          >
            Try again
          </button>
        </div>
      ) : null}

      {library ? (
        <PreviewProvider>
          <div className="rounded-xl border border-line bg-panel p-4 sm:p-5">
            <TrackSearch
              tracks={library.tracks}
              selected={query}
              onSelect={setQuery}
            />
            <div className="mt-5">
              <Controls
                mode={mode}
                tolPct={tolPct}
                harmonic={harmonic}
                onMode={setMode}
                onTol={setTolPct}
                onHarmonic={setHarmonic}
              />
            </div>
          </div>

          {selected && query != null ? (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-6">
                <article className="rounded-xl border border-line bg-panel p-5">
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">
                    Selected track
                  </p>
                  <h3 className="mt-2 font-display text-2xl leading-tight break-words text-cream">
                    {trackLabel(selected)}
                  </h3>
                  <div className="mt-3">
                    <TrackFacts track={selected} />
                  </div>
                  <TrackRadar radar={selected.radar} />
                  <div className="mt-5">
                    <PreviewControls id={deezerId(selected)} label={trackLabel(selected)} />
                  </div>
                </article>
                <CamelotWheel camelot={selected.camelot} mode={mode} harmonic={harmonic} />
              </div>

              <div className="min-w-0">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl text-cream">Suggestions</h3>
                  <p className="text-sm text-muted" aria-live="polite">
                    {ranked.length === 10 ? "Top 10" : `${ranked.length} tracks`}
                  </p>
                </div>
                {ranked.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line px-5 py-8 text-sm text-muted">
                    No tracks match these filters. Widen the BPM tolerance or turn off the
                    harmonic filter.
                  </p>
                ) : (
                  <ol className="flex flex-col gap-3">
                    {ranked.map((hit) => {
                      const track = library.tracks[hit.index];
                      const label = trackLabel(track);
                      const preview = deezerId(track);
                      return (
                        <li key={hit.index}>
                          <article className="rounded-xl border border-line bg-panel p-4">
                            <h4 className="text-base leading-snug break-words text-cream">{label}</h4>
                            <p className="mt-1 text-sm text-muted">
                              {track.bpm == null
                                ? "BPM unknown"
                                : `${formatBpm(track.bpm)} BPM`}
                              {track.genre.trim() ? ` · ${track.genre.trim()}` : ""}
                            </p>
                            <div className="mt-2">
                              <CamelotBadge camelot={track.camelot} label={hit.label} />
                            </div>
                            <div className="mt-4">
                              <SimilarityBar score={hit.score} />
                            </div>
                            <RadarCompare query={selected.radar} suggestion={track.radar} />
                            <div className="mt-4">
                              <PreviewControls id={preview} label={label} />
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-line px-5 py-8 text-sm text-muted">
              Choose a track to see what could follow it.
            </p>
          )}
        </PreviewProvider>
      ) : null}
    </section>
  );
}
