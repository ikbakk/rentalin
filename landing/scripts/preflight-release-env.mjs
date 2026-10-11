import { pathToFileURL } from "node:url";
import { validatePublicWhatsAppNumber } from "../src/lib/public-env.mjs";

export { validatePublicWhatsAppNumber };

export function runPreflight(env = process.env) {
  validatePublicWhatsAppNumber(env.PUBLIC_WHATSAPP_NUMBER);
  return "Landing release environment preflight passed.";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(runPreflight());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
