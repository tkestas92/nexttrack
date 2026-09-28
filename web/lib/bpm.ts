export function bpmCompatible(a: number, b: number, tolPct: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
    return false;
  }
  if (!Number.isFinite(tolPct) || tolPct < 0) return false;

  const tol = tolPct / 100;
  for (const candidate of [b, b * 2, b / 2]) {
    if (Math.abs(a - candidate) / a <= tol) return true;
  }
  return false;
}
