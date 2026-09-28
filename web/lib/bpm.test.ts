import { describe, expect, it } from "vitest";
import { bpmCompatible } from "./bpm";

describe("bpmCompatible", () => {
  it("accepts the same tempo and a tempo inside the percentage", () => {
    expect(bpmCompatible(128, 128, 3)).toBe(true);
    expect(bpmCompatible(128, 130, 3)).toBe(true);
    expect(bpmCompatible(100, 103, 3)).toBe(true);
  });

  it("rejects a tempo outside the percentage", () => {
    expect(bpmCompatible(100, 104, 3)).toBe(false);
    expect(bpmCompatible(128, 135, 3)).toBe(false);
    expect(bpmCompatible(128, 135, 6)).toBe(true);
    expect(bpmCompatible(128, 100, 6)).toBe(false);
  });

  it("accepts half-time and double-time", () => {
    expect(bpmCompatible(128, 64, 3)).toBe(true);
    expect(bpmCompatible(128, 256, 3)).toBe(true);
    expect(bpmCompatible(140, 70, 3)).toBe(true);
    expect(bpmCompatible(70, 140, 3)).toBe(true);
  });

  it("rejects missing or non-positive tempos", () => {
    expect(bpmCompatible(0, 128, 6)).toBe(false);
    expect(bpmCompatible(128, 0, 6)).toBe(false);
    expect(bpmCompatible(Number.NaN, 128, 6)).toBe(false);
    expect(bpmCompatible(128, Number.POSITIVE_INFINITY, 6)).toBe(false);
  });
});
