export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const UPLOAD_URL_SECONDS = 300;
export const READ_URL_SECONDS = 300;
export const ABANDONED_UPLOAD_MS = 24 * 60 * 60 * 1000;
export const FINALIZE_WINDOW_MS = 15 * 60 * 1000;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateImage(contentType: string, size: number) {
  if (!TYPES.has(contentType) || !Number.isSafeInteger(size) || size < 1 || size > MAX_IMAGE_SIZE) {
    throw new Error("Choose a JPEG, PNG, or WebP image no larger than 5 MB");
  }
}

// Reject MIME spoofing before storing a trusted, immutable final object.
export function validateImageBytes(contentType: string, bytes: Uint8Array) {
  validateImage(contentType, bytes.length);
  const starts = (signature: number[]) => signature.every((n, i) => bytes[i] === n);
  const valid = contentType === "image/png" ? starts([137,80,78,71,13,10,26,10])
    : contentType === "image/jpeg" ? starts([255,216,255])
    : starts([82,73,70,70]) && [87,69,66,80].every((n, i) => bytes[i + 8] === n);
  if (!valid) throw new Error("Image content does not match its file type");
}
