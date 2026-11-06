// Float32Array to 16-bit little-endian PCM Base64 string
export const floatTo16BitPCMBase64 = (float32Array: Float32Array): string => {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Base64 16-bit little-endian PCM string to Float32Array
export const base64ToFloat32Array = (base64: string): Float32Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const dataView = new DataView(bytes.buffer);
  const float32Array = new Float32Array(bytes.length / 2);
  for (let i = 0; i < float32Array.length; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    float32Array[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
  }
  return float32Array;
};
