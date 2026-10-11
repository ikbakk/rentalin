export function requirePublicEnv(value, name) {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${name} is required. Copy frontend/.env.example and configure it before starting the app.`);
  }

  return normalized;
}
