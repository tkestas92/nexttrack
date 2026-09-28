import { describe, expect, it } from "vitest";
import { camelotNeighbors } from "./camelot";

describe("camelotNeighbors", () => {
  it("keeps the same key, both neighbors, and the relative", () => {
    expect(camelotNeighbors("8A", "keep")).toEqual({
      "8A": "Same key",
      "9A": "Adjacent",
      "7A": "Adjacent",
      "8B": "Relative",
    });
  });

  it("wraps 12 forward to 1 and 1 back to 12", () => {
    expect(camelotNeighbors("12A", "keep")).toEqual({
      "12A": "Same key",
      "1A": "Adjacent",
      "11A": "Adjacent",
      "12B": "Relative",
    });
    expect(camelotNeighbors("1B", "keep")).toEqual({
      "1B": "Same key",
      "2B": "Adjacent",
      "12B": "Adjacent",
      "1A": "Relative",
    });
  });

  it("marks +2 and +7 on the same letter as an energy boost", () => {
    expect(camelotNeighbors("8A", "boost")).toEqual({
      "10A": "Energy boost",
      "3A": "Energy boost",
    });
    expect(camelotNeighbors("12B", "boost")).toEqual({
      "2B": "Energy boost",
      "7B": "Energy boost",
    });
    expect(camelotNeighbors("1A", "boost")).toEqual({
      "3A": "Energy boost",
      "8A": "Energy boost",
    });
  });

  it("marks -2 and -7 on the same letter as an energy drop", () => {
    expect(camelotNeighbors("8A", "drop")).toEqual({
      "6A": "Energy drop",
      "1A": "Energy drop",
    });
    expect(camelotNeighbors("2A", "drop")).toEqual({
      "12A": "Energy drop",
      "7A": "Energy drop",
    });
    expect(camelotNeighbors("1A", "drop")).toEqual({
      "11A": "Energy drop",
      "6A": "Energy drop",
    });
  });

  it("accepts lowercase keys and rejects keys outside the wheel", () => {
    expect(camelotNeighbors(" 8a ", "keep")["8A"]).toBe("Same key");
    expect(camelotNeighbors("", "keep")).toEqual({});
    expect(camelotNeighbors("A8", "boost")).toEqual({});
    expect(camelotNeighbors("0A", "drop")).toEqual({});
    expect(camelotNeighbors("13B", "keep")).toEqual({});
    expect(camelotNeighbors("8", "keep")).toEqual({});
  });
});
