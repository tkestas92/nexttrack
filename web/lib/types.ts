export type Track = {
  artist: string;
  title: string;
  genre: string;
  bpm: number | null;
  camelot: string | null;
  deezer: number | null;
};

export type Library = {
  dim: number;
  tracks: Track[];
  vectors: Float32Array;
};

export type Mode = "keep" | "boost" | "drop";

export type TolPct = 3 | 6;

export type CamelotLabel =
  | "Same key"
  | "Adjacent"
  | "Relative"
  | "Energy boost"
  | "Energy drop";

export type RankOptions = {
  mode: Mode;
  tolPct: number;
  harmonic: boolean;
};

export type RankedTrack = {
  index: number;
  score: number;
  label: CamelotLabel | null;
};
