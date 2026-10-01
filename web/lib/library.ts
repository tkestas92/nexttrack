import { decodeFloat16 } from "./float16";
import type { Library, Track } from "./types";

function isTrack(value: unknown): value is Track {
  if (!value || typeof value !== "object") return false;
  const track = value as Record<string, unknown>;
  return (
    typeof track.artist === "string" &&
    typeof track.title === "string" &&
    typeof track.genre === "string" &&
    (typeof track.bpm === "number" || track.bpm === null) &&
    (typeof track.camelot === "string" || track.camelot === null) &&
    (typeof track.deezer === "number" || track.deezer === null) &&
    isRadar(track.radar)
  );
}

function isRadar(value: unknown): value is number[] | null {
  return (
    value === null ||
    (Array.isArray(value) && value.every((item) => typeof item === "number" && Number.isFinite(item)))
  );
}

export async function loadLibrary(
  fetchImpl: typeof fetch = fetch,
): Promise<Library> {
  const [metaRes, binRes] = await Promise.all([
    fetchImpl("/data/tracks.json"),
    fetchImpl("/data/vectors.bin"),
  ]);

  if (!metaRes.ok || !binRes.ok) {
    throw new Error("The track list or the embeddings could not be downloaded.");
  }

  const meta: unknown = await metaRes.json();
  if (!meta || typeof meta !== "object") {
    throw new Error("The track list is not valid.");
  }

  const record = meta as Record<string, unknown>;
  if (typeof record.dim !== "number" || !Array.isArray(record.tracks)) {
    throw new Error("The track list is not valid.");
  }
  if (!record.tracks.every(isTrack)) {
    throw new Error("The track list is not valid.");
  }

  const buffer = await binRes.arrayBuffer();
  const expected = record.tracks.length * record.dim * 2;
  if (buffer.byteLength !== expected) {
    throw new Error("The embeddings do not match the track list.");
  }

  return {
    dim: record.dim,
    tracks: record.tracks,
    vectors: decodeFloat16(buffer),
  };
}
