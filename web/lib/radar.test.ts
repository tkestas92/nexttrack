import { describe, expect, it } from "vitest";
import { biggestDifference, similarAxes } from "./radar";

const base = [10, 20, 30, 40, 50, 60];

describe("similarAxes", () => {
  it("returns axes within the threshold, in axis order", () => {
    const other = [22, 20, 43, 40, 80, 60];
    expect(similarAxes(base, other, 12)).toEqual(["relaxed", "party", "happy", "vocal"]);
  });

  it("includes a gap equal to the threshold and excludes one point past it", () => {
    expect(similarAxes([0, 0, 0, 0, 0, 0], [12, 13, 0, 0, 0, 0], 12)).toEqual([
      "relaxed",
      "aggressive",
      "happy",
      "sad",
      "vocal",
    ]);
  });

  it("returns an empty list when every axis is further apart", () => {
    expect(similarAxes([0, 0, 0, 0, 0, 0], [13, 40, 50, 60, 70, 80], 12)).toEqual([]);
  });

  it("returns null when either radar is missing or unusable", () => {
    expect(similarAxes(null, base, 12)).toBeNull();
    expect(similarAxes(base, null, 12)).toBeNull();
    expect(similarAxes(null, null, 12)).toBeNull();
    expect(similarAxes([1, 2, 3], base, 12)).toBeNull();
    expect(similarAxes([Number.NaN, 0, 0, 0, 0, 0], base, 12)).toBeNull();
    expect(similarAxes(base, base, Number.NaN)).toBeNull();
  });
});

describe("biggestDifference", () => {
  it("names the axis with the largest absolute gap", () => {
    const other = [10, 25, 90, 40, 51, 60];
    expect(biggestDifference(base, other)).toBe("aggressive");
  });

  it("breaks a tie by the earlier axis", () => {
    const other = [40, 20, 60, 40, 50, 60];
    expect(biggestDifference(base, other)).toBe("relaxed");
  });

  it("still names an axis when the radars match", () => {
    expect(biggestDifference(base, [...base])).toBe("relaxed");
  });

  it("returns null when either radar is missing or unusable", () => {
    expect(biggestDifference(null, base)).toBeNull();
    expect(biggestDifference(base, null)).toBeNull();
    expect(biggestDifference(null, null)).toBeNull();
    expect(biggestDifference([], base)).toBeNull();
    expect(biggestDifference([1, 2, 3, 4, 5, Number.POSITIVE_INFINITY], base)).toBeNull();
  });
});
