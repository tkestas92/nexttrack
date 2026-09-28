import { describe, expect, it } from "vitest";
import { rank, scorePercent } from "./rank";
import type { Library, Track } from "./types";

function track(partial: Partial<Track> & Pick<Track, "artist" | "title">): Track {
  return {
    genre: "House",
    bpm: 120,
    camelot: "8A",
    deezer: null,
    ...partial,
  };
}

function library(tracks: Track[], rows: number[][]): Library {
  const dim = rows[0].length;
  const vectors = new Float32Array(tracks.length * dim);
  rows.forEach((row, index) => {
    row.forEach((value, axis) => {
      vectors[index * dim + axis] = value;
    });
  });
  return { dim, tracks, vectors };
}

const base = library(
  [
    track({ artist: "Q", title: "Query", deezer: 1 }),
    track({ artist: "Q", title: "Query", deezer: 2 }),
    track({ artist: "Same", title: "Key" }),
    track({ artist: "Adj", title: "Up", camelot: "9A" }),
    track({ artist: "Rel", title: "Key", camelot: "8B" }),
    track({ artist: "Far", title: "Key", camelot: "1A" }),
    track({ artist: "Fast", title: "Nope", bpm: 150 }),
    track({ artist: "Half", title: "Time", bpm: 60 }),
    track({ artist: "No", title: "Key", camelot: null }),
    track({ artist: "No", title: "Bpm", bpm: null }),
    track({ artist: "Boost", title: "Two", camelot: "10A" }),
    track({ artist: "Boost", title: "Seven", camelot: "3A" }),
    track({ artist: "Drop", title: "Two", camelot: "6A" }),
    track({ artist: "Wide", title: "Bpm", bpm: 126 }),
    track({ artist: "Copy", title: "Song" }),
    track({ artist: "Copy", title: "Song" }),
  ],
  [
    [1, 0],
    [1, 0],
    [0.5, 0],
    [0.9, 0],
    [0.2, 0],
    [0.99, 0],
    [0.95, 0],
    [0.4, 0],
    [0.97, 0],
    [0.96, 0],
    [0.7, 0],
    [0.6, 0],
    [0.55, 0],
    [0.3, 0],
    [0.85, 0],
    [0.45, 0],
  ],
);

describe("rank", () => {
  it("keeps harmonic and BPM matches, drops the query and its duplicate", () => {
    const ranked = rank(0, { mode: "keep", tolPct: 6, harmonic: true }, base);
    expect(ranked.map((hit) => hit.index)).toEqual([3, 14, 2, 7, 13, 4]);
    expect(ranked.map((hit) => hit.label)).toEqual([
      "Adjacent",
      "Same key",
      "Same key",
      "Same key",
      "Same key",
      "Relative",
    ]);
    expect(ranked[0].score).toBeCloseTo(0.9);
  });

  it("uses boost and drop keys instead of the keep set", () => {
    const boost = rank(0, { mode: "boost", tolPct: 6, harmonic: true }, base);
    expect(boost.map((hit) => [hit.index, hit.label])).toEqual([
      [10, "Energy boost"],
      [11, "Energy boost"],
    ]);

    const drop = rank(0, { mode: "drop", tolPct: 6, harmonic: true }, base);
    expect(drop.map((hit) => [hit.index, hit.label])).toEqual([
      [5, "Energy drop"],
      [12, "Energy drop"],
    ]);
  });

  it("still filters BPM when the harmonic filter is off", () => {
    const ranked = rank(0, { mode: "keep", tolPct: 6, harmonic: false }, base);
    expect(ranked.map((hit) => hit.index)).toEqual([
      5, 8, 3, 14, 10, 11, 12, 2, 7, 13,
    ]);
    expect(ranked.find((hit) => hit.index === 8)?.label).toBeNull();
    expect(ranked.find((hit) => hit.index === 5)?.label).toBeNull();
  });

  it("applies the tighter BPM tolerance", () => {
    const tight = rank(0, { mode: "keep", tolPct: 3, harmonic: true }, base);
    expect(tight.map((hit) => hit.index)).not.toContain(13);
    const wide = rank(0, { mode: "keep", tolPct: 6, harmonic: true }, base);
    expect(wide.map((hit) => hit.index)).toContain(13);
  });

  it("skips null Camelot only while the harmonic filter is on", () => {
    const harmonic = rank(0, { mode: "keep", tolPct: 6, harmonic: true }, base);
    expect(harmonic.map((hit) => hit.index)).not.toContain(8);
    const open = rank(0, { mode: "keep", tolPct: 6, harmonic: false }, base);
    expect(open.map((hit) => hit.index)).toContain(8);
  });

  it("skips null BPM and keeps a single copy of an exact duplicate", () => {
    const ranked = rank(0, { mode: "keep", tolPct: 6, harmonic: false }, base);
    expect(ranked.map((hit) => hit.index)).not.toContain(9);
    expect(ranked.map((hit) => hit.index)).not.toContain(1);
    expect(ranked.filter((hit) => base.tracks[hit.index].title === "Song")).toEqual([
      expect.objectContaining({ index: 14 }),
    ]);
  });

  it("returns at most ten tracks, highest score first", () => {
    const tracks = [
      track({ artist: "Q", title: "Query" }),
      ...Array.from({ length: 12 }, (_, index) =>
        track({ artist: "C", title: `T${index}`, camelot: "8A", bpm: 120 }),
      ),
    ];
    const rows = [[1, 0], ...tracks.slice(1).map((_, index) => [index / 100, 0])];
    const ranked = rank(0, { mode: "keep", tolPct: 6, harmonic: true }, library(tracks, rows));
    expect(ranked).toHaveLength(10);
    expect(ranked.map((hit) => hit.index)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
  });

  it("returns nothing when the query has no BPM or no key under the harmonic filter", () => {
    const quiet = library(
      [
        track({ artist: "Q", title: "Query", bpm: null }),
        track({ artist: "A", title: "B" }),
      ],
      [
        [1, 0],
        [1, 0],
      ],
    );
    expect(rank(0, { mode: "keep", tolPct: 6, harmonic: true }, quiet)).toEqual([]);

    const noKey = library(
      [
        track({ artist: "Q", title: "Query", camelot: null }),
        track({ artist: "A", title: "B" }),
      ],
      [
        [1, 0],
        [1, 0],
      ],
    );
    expect(rank(0, { mode: "keep", tolPct: 6, harmonic: true }, noKey)).toEqual([]);
    expect(rank(0, { mode: "keep", tolPct: 6, harmonic: false }, noKey)).toHaveLength(1);
    expect(rank(9, { mode: "keep", tolPct: 6, harmonic: true }, base)).toEqual([]);
  });

  it("turns a dot product into a percentage", () => {
    expect(scorePercent(0.596)).toBe(60);
    expect(scorePercent(-0.2)).toBe(0);
    expect(scorePercent(1.2)).toBe(100);
    expect(scorePercent(Number.NaN)).toBe(0);
  });
});
