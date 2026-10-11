import assert from "node:assert/strict";
import { test } from "node:test";
import { validatePublicWhatsAppNumber } from "../src/lib/public-env.mjs";

test("accepts an international WhatsApp number in digits-only format", () => {
  assert.equal(validatePublicWhatsAppNumber(" 6281234567890 "), "6281234567890");
});

test("rejects a missing public WhatsApp number", () => {
  assert.throws(() => validatePublicWhatsAppNumber(""), /PUBLIC_WHATSAPP_NUMBER is required/);
});

test("rejects local-format or non-digit WhatsApp numbers", () => {
  assert.throws(() => validatePublicWhatsAppNumber("081234567890"), /international format/);
  assert.throws(() => validatePublicWhatsAppNumber("+6281234567890"), /international format/);
});

test("rejects WhatsApp numbers outside E.164 length bounds", () => {
  assert.throws(() => validatePublicWhatsAppNumber("1234567"), /8 to 15 digits/);
  assert.throws(() => validatePublicWhatsAppNumber("1234567890123456"), /8 to 15 digits/);
});
