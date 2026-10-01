export const PREVIEW_MISSING = "No preview available";
export const PREVIEW_FAILED = "Preview unavailable";

export type PreviewPhase = "idle" | "loading" | "playing" | "paused" | "error";

export type PreviewSlot =
  | { state: "missing"; text: typeof PREVIEW_MISSING }
  | { state: "unavailable"; text: typeof PREVIEW_FAILED }
  | { state: "loading" }
  | { state: "playing" }
  | { state: "ready" };

export function previewSlot(input: {
  previewId: number | null;
  isActive: boolean;
  phase: PreviewPhase;
}): PreviewSlot {
  if (input.previewId == null) {
    return { state: "missing", text: PREVIEW_MISSING };
  }
  if (input.isActive && input.phase === "error") {
    return { state: "unavailable", text: PREVIEW_FAILED };
  }
  if (input.isActive && input.phase === "loading") {
    return { state: "loading" };
  }
  if (input.isActive && input.phase === "playing") {
    return { state: "playing" };
  }
  return { state: "ready" };
}
