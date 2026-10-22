import { pathToFileURL } from "node:url";

const REQUIRED_URLS = [
  "NEXT_PUBLIC_CONVEX_URL",
  "CONVEX_SITE_URL",
  "NEXT_PUBLIC_FRONTEND_URL",
];

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function readHttpsOrigin(env, name, errors) {
  const value = env[name]?.trim();
  if (!value) {
    errors.push(`${name} is required for a release build.`);
    return null;
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    errors.push(`${name} must be a valid HTTPS URL.`);
    return null;
  }

  if (url.protocol !== "https:") {
    errors.push(`${name} must use HTTPS.`);
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    errors.push(`${name} must contain only an origin, without credentials, path, query, or fragment.`);
  }
  if (LOCAL_HOSTS.has(url.hostname) || url.hostname.endsWith(".localhost") || url.hostname.endsWith(".local")) {
    errors.push(`${name} cannot point to a local host in a release build.`);
  }

  return url;
}

export function validateReleaseEnvironment(env) {
  const errors = [];
  const convexUrl = readHttpsOrigin(env, REQUIRED_URLS[0], errors);
  const siteUrl = readHttpsOrigin(env, REQUIRED_URLS[1], errors);
  readHttpsOrigin(env, REQUIRED_URLS[2], errors);

  if (convexUrl && siteUrl) {
    const cloudSuffix = ".convex.cloud";
    const siteSuffix = ".convex.site";
    const deployment = convexUrl.hostname.endsWith(cloudSuffix)
      ? convexUrl.hostname.slice(0, -cloudSuffix.length)
      : null;
    const siteDeployment = siteUrl.hostname.endsWith(siteSuffix)
      ? siteUrl.hostname.slice(0, -siteSuffix.length)
      : null;
    if (!deployment || !siteDeployment || deployment !== siteDeployment) {
      errors.push("NEXT_PUBLIC_CONVEX_URL and CONVEX_SITE_URL must use the same Convex deployment.");
    }
  }

  if (!env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()) errors.push("NEXT_PUBLIC_TURNSTILE_SITE_KEY is required for public booking.");

  if (errors.length) throw new Error([...new Set(errors)].join("\n"));
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { default: nextEnv } = await import("@next/env");
    nextEnv.loadEnvConfig(process.cwd());
    validateReleaseEnvironment(process.env);
    console.log("Release environment preflight passed.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
