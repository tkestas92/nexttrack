import { describe, expect, it } from "vitest";
import { PREVIEW_FAILED, PREVIEW_MISSING, previewSlot } from "./preview-state";

describe("previewSlot", () => {
  it("shows the missing label when the track has no preview id", () => {
    expect(previewSlot({ previewId: null, isActive: false, phase: "idle" })).toEqual({
      state: "missing",
      text: PREVIEW_MISSING,
    });
    expect(previewSlot({ previewId: null, isActive: true, phase: "error" }).state).toBe(
      "missing",
    );
  });

  it("keeps a play control when a preview id exists and nothing has failed", () => {
    expect(previewSlot({ previewId: 12, isActive: false, phase: "idle" }).state).toBe("ready");
    expect(previewSlot({ previewId: 12, isActive: true, phase: "paused" }).state).toBe("ready");
    expect(previewSlot({ previewId: 12, isActive: false, phase: "error" }).state).toBe("ready");
  });

  it("shows loading and playing only for the active preview", () => {
    expect(previewSlot({ previewId: 12, isActive: true, phase: "loading" }).state).toBe(
      "loading",
    );
    expect(previewSlot({ previewId: 12, isActive: true, phase: "playing" }).state).toBe(
      "playing",
    );
  });

  it("shows Preview unavailable when the active request fails, including a 404", () => {
    expect(previewSlot({ previewId: 12, isActive: true, phase: "error" })).toEqual({
      state: "unavailable",
      text: PREVIEW_FAILED,
    });
  });
});
