/**
 * Single source of truth for the landing page's contact/demo links.
 *
 * The landing is a standalone marketing site: the primary conversion path is
 * a WhatsApp demo request, not the app login. Swap `WHATSAPP_NUMBER` for the
 * real business number (international format, digits only) before launch.
 */

/** Business WhatsApp number in international format, digits only. TODO: replace before launch. */
export const WHATSAPP_NUMBER = '6281234567890';

/** Pre-filled message sent when someone books a demo from the landing. */
export const DEMO_MESSAGE = 'Halo, saya ingin melihat demo Rentalin untuk bisnis rental saya.';

export const DEMO_WA_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEMO_MESSAGE)}`;
