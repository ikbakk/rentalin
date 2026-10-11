export const BUSINESS_TIME_ZONES = [
  { value: "Asia/Jakarta", label: "WIB — Western Indonesia" },
  { value: "Asia/Makassar", label: "WITA — Central Indonesia" },
  { value: "Asia/Jayapura", label: "WIT — Eastern Indonesia" },
] as const;

export type BusinessTimeZone = typeof BUSINESS_TIME_ZONES[number]["value"];

export const DEFAULT_BUSINESS_TIME_ZONE: BusinessTimeZone = "Asia/Jakarta";

export function isBusinessTimeZone(value: string): value is BusinessTimeZone {
  return BUSINESS_TIME_ZONES.some((zone) => zone.value === value);
}

export function resolveBusinessTimeZone(value: string | undefined): BusinessTimeZone {
  return value && isBusinessTimeZone(value) ? value : DEFAULT_BUSINESS_TIME_ZONE;
}
