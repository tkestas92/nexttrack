export function float16ToFloat32(h: number): number {
  const sign = (h & 0x8000) >> 15;
  const exponent = (h & 0x7c00) >> 10;
  const fraction = h & 0x03ff;

  if (exponent === 0) {
    if (fraction === 0) return sign ? -0 : 0;
    return (sign ? -1 : 1) * 2 ** -14 * (fraction / 1024);
  }

  if (exponent === 0x1f) {
    if (fraction === 0) {
      return sign ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    }
    return Number.NaN;
  }

  return (sign ? -1 : 1) * 2 ** (exponent - 15) * (1 + fraction / 1024);
}

export function decodeFloat16(buffer: ArrayBuffer): Float32Array {
  if (buffer.byteLength % 2 !== 0) {
    throw new Error("Float16 buffer length must be even.");
  }

  const view = new DataView(buffer);
  const out = new Float32Array(buffer.byteLength / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = float16ToFloat32(view.getUint16(i * 2, true));
  }
  return out;
}
