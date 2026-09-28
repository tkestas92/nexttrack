import { bpmCompatible } from "./bpm";
import { camelotNeighbors } from "./camelot";
import type { Library, RankedTrack, RankOptions, Track } from "./types";

function identity(track: Track): string {
  return `${track.artist.trim()}\0${track.title.trim()}`;
}

function dot(
  vectors: Float32Array,
  dim: number,
  i: number,
  j: number,
): number {
  let sum = 0;
  const left = i * dim;
  const right = j * dim;
  for (let k = 0; k < dim; k++) {
    sum += vectors[left + k] * vectors[right + k];
  }
  return sum;
}

export function scorePercent(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.round(Math.min(1, Math.max(0, score)) * 100);
}

export function rank(
  queryIndex: number,
  options: RankOptions,
  library: Library,
): RankedTrack[] {
  const { tracks, vectors, dim } = library;
  const query = tracks[queryIndex];
  if (!query || queryIndex < 0 || !Number.isInteger(queryIndex)) return [];
  if (query.bpm == null || !Number.isFinite(query.bpm) || query.bpm <= 0) {
    return [];
  }
  if (vectors.length < tracks.length * dim) return [];

  const neighbors = query.camelot
    ? camelotNeighbors(query.camelot, options.mode)
    : {};
  if (options.harmonic && Object.keys(neighbors).length === 0) return [];

  const queryId = identity(query);
  const hits: RankedTrack[] = [];

  for (let index = 0; index < tracks.length; index++) {
    if (index === queryIndex) continue;
    const track = tracks[index];
    if (identity(track) === queryId) continue;
    if (track.bpm == null || !Number.isFinite(track.bpm)) continue;
    if (!bpmCompatible(query.bpm, track.bpm, options.tolPct)) continue;

    let label: RankedTrack["label"] = null;
    if (options.harmonic) {
      if (!track.camelot) continue;
      const match = neighbors[track.camelot];
      if (!match) continue;
      label = match;
    } else if (track.camelot) {
      label = neighbors[track.camelot] ?? null;
    }

    const score = dot(vectors, dim, queryIndex, index);
    if (!Number.isFinite(score)) continue;
    hits.push({ index, score, label });
  }

  hits.sort((a, b) => b.score - a.score || a.index - b.index);

  const seen = new Set<string>();
  const unique: RankedTrack[] = [];
  for (const hit of hits) {
    const key = identity(tracks[hit.index]);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(hit);
    if (unique.length === 10) break;
  }
  return unique;
}
