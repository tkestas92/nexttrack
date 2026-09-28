import { describe, expect, it } from "vitest";
import { decodeFloat16, float16ToFloat32 } from "./float16";

function bytes(values: number[]): ArrayBuffer {
  const buffer = new ArrayBuffer(values.length * 2);
  const view = new DataView(buffer);
  values.forEach((value, index) => view.setUint16(index * 2, value, true));
  return buffer;
}

describe("float16", () => {
  it("decodes common values from little-endian bytes", () => {
    const decoded = decodeFloat16(bytes([0x3c00, 0x3800, 0xc000, 0x0000]));
    expect(Array.from(decoded)).toEqual([1, 0.5, -2, 0]);
  });

  it("matches DataView float16 across the encoding space", () => {
    const view = new DataView(new ArrayBuffer(2));
    for (let bits = 0; bits < 65536; bits += 17) {
      view.setUint16(0, bits, true);
      const expected = view.getFloat16(0, true);
      const actual = float16ToFloat32(bits);
      if (Number.isNaN(expected)) expect(Number.isNaN(actual)).toBe(true);
      else expect(actual).toBe(expected);
    }
  });

  it("rejects an odd number of bytes", () => {
    expect(() => decodeFloat16(new ArrayBuffer(1))).toThrow(/even/);
  });
});
