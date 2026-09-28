import type { CamelotLabel, Mode } from "./types";

const KEY = /^(\d{1,2})([AB])$/i;

function shift(n: number, delta: number): number {
  return ((((n - 1 + delta) % 12) + 12) % 12) + 1;
}

export function camelotNeighbors(
  key: string,
  mode: Mode,
): Record<string, CamelotLabel> {
  const match = KEY.exec(key.trim());
  if (!match) return {};

  const n = Number(match[1]);
  const letter = match[2].toUpperCase();
  if (n < 1 || n > 12) return {};

  const other = letter === "A" ? "B" : "A";
  const same = `${n}${letter}`;

  if (mode === "keep") {
    return {
      [same]: "Same key",
      [`${shift(n, 1)}${letter}`]: "Adjacent",
      [`${shift(n, -1)}${letter}`]: "Adjacent",
      [`${n}${other}`]: "Relative",
    };
  }

  if (mode === "boost") {
    return {
      [`${shift(n, 2)}${letter}`]: "Energy boost",
      [`${shift(n, 7)}${letter}`]: "Energy boost",
    };
  }

  return {
    [`${shift(n, -2)}${letter}`]: "Energy drop",
    [`${shift(n, -7)}${letter}`]: "Energy drop",
  };
}
