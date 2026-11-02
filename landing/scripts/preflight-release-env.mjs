import { pathToFileURL } from "node:url";
import { validatePublicWhatsAppNumber, validatePublicAppOrigin } from "../src/lib/public-env.mjs";

export { validatePublicWhatsAppNumber, validatePublicAppOrigin };

export function runPreflight(env = process.env) {
  validatePublicWhatsAppNumber(env.PUBLIC_WHATSAPP_NUMBER);
  validatePublicAppOrigin(env.PUBLIC_APP_URL);
  return "Landing release environment preflight passed.";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { loadEnv } = await import("vite");
    console.log(runPreflight({ ...loadEnv("production", process.cwd(), ""), ...process.env }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
