/**
 * Validate the public WhatsApp number used by the marketing site.
 * The value must be an international number in digits-only form.
 */
export function validatePublicWhatsAppNumber(value) {
  const number = value?.trim();

  if (!number) {
    throw new Error("PUBLIC_WHATSAPP_NUMBER is required. Configure it from landing/.env.example.");
  }

  if (!/^[1-9]\d{7,14}$/.test(number)) {
    throw new Error("PUBLIC_WHATSAPP_NUMBER must use international format with 8 to 15 digits and no symbols.");
  }

  return number;
}

/** Absolute app origin: landing and Next.js may be deployed independently. */
export function validatePublicAppOrigin(value) {
  if (!value?.trim()) throw new Error("PUBLIC_APP_URL is required.");
  const url = new URL(value.trim());
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("PUBLIC_APP_URL must be a public HTTPS origin without a path or credentials.");
  }
  return url.origin;
}
