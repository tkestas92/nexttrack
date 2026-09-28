const STEPS = [
  "Rekordbox USB export",
  "Essentia Discogs-EffNet embeddings (512-d)",
  "Mean-centering",
  "Camelot / BPM filter",
  "Ranking in the browser",
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-t border-line pt-10">
      <h2 id="how-heading" className="font-display text-2xl text-cream">
        How it works
      </h2>
      <ol className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-3 sm:max-w-xs">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-xs text-gold tabular-nums">
              {index + 1}
            </span>
            <span className="text-sm text-cream">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
        No audio files are hosted. The site ships embeddings and metadata only.
        A preview plays from Deezer when you press play, and that address is not stored.
      </p>
    </section>
  );
}
