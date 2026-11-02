import { validatePublicWhatsAppNumber } from "./public-env.mjs";

/**
 * Single source of truth for the landing page's contact/demo links.
 * The public number is configured with PUBLIC_WHATSAPP_NUMBER at build time.
 */

/** Business WhatsApp number in international format, digits only. */
export const WHATSAPP_NUMBER = validatePublicWhatsAppNumber(import.meta.env.PUBLIC_WHATSAPP_NUMBER);

/** Pre-filled message sent when someone books a demo from the landing. */
export const DEMO_MESSAGE = 'Halo, saya ingin melihat demo Rentalin untuk bisnis rental saya.';

export const DEMO_WA_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEMO_MESSAGE)}`;
