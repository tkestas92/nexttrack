export const RADAR_AXES = [
  { id: "relaxed", label: "Relaxed", phrase: "relaxed" },
  { id: "party", label: "Party", phrase: "party" },
  { id: "aggressive", label: "Aggressive", phrase: "aggressive" },
  { id: "happy", label: "Happy", phrase: "happy" },
  { id: "sad", label: "Sad", phrase: "sad" },
  { id: "voice", label: "Vocal", phrase: "vocal" },
] as const;

const AXIS_COUNT = RADAR_AXES.length;

export function usableRadar(radar: number[] | null | undefined): number[] | null {
  if (!radar || radar.length !== AXIS_COUNT) return null;
  if (radar.some((value) => typeof value !== "number" || !Number.isFinite(value))) return null;
  return radar;
}

export function similarAxes(
  a: number[] | null,
  b: number[] | null,
  threshold: number,
): string[] | null {
  const left = usableRadar(a);
  const right = usableRadar(b);
  if (!left || !right || !Number.isFinite(threshold)) return null;
  const phrases: string[] = [];
  for (let index = 0; index < AXIS_COUNT; index += 1) {
    if (Math.abs(left[index] - right[index]) <= threshold) {
      phrases.push(RADAR_AXES[index].phrase);
    }
  }
  return phrases;
}

export function biggestDifference(a: number[] | null, b: number[] | null): string | null {
  const left = usableRadar(a);
  const right = usableRadar(b);
  if (!left || !right) return null;
  let best = 0;
  let gap = -1;
  for (let index = 0; index < AXIS_COUNT; index += 1) {
    const delta = Math.abs(left[index] - right[index]);
    if (delta > gap) {
      gap = delta;
      best = index;
    }
  }
  return RADAR_AXES[best].phrase;
}
