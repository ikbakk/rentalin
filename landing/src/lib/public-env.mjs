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
