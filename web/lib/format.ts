import type { Track } from "./types";

export function trackLabel(track: Track): string {
  return `${track.artist.trim()} - ${track.title.trim()}`;
}

export function formatBpm(bpm: number): string {
  const rounded = Math.round(bpm * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
