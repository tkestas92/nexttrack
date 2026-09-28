import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows a fixed number of hits per key and window", () => {
    const allow = createRateLimiter(2, 1_000);
    expect(allow("1.2.3.4", 0)).toBe(true);
    expect(allow("1.2.3.4", 100)).toBe(true);
    expect(allow("1.2.3.4", 200)).toBe(false);
    expect(allow("5.6.7.8", 200)).toBe(true);
    expect(allow("1.2.3.4", 1_200)).toBe(true);
  });
});
