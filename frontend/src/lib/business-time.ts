import {
  BUSINESS_TIME_ZONES,
  DEFAULT_BUSINESS_TIME_ZONE,
  resolveBusinessTimeZone,
} from "../../../convex/businessTime";

export { BUSINESS_TIME_ZONES, DEFAULT_BUSINESS_TIME_ZONE, resolveBusinessTimeZone };
export type { BusinessTimeZone } from "../../../convex/businessTime";

function getDateParts(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((parts, part) => {
    parts[part.type] = part.value;
    return parts;
  }, {});
}

export function isoToBusinessDate(value: string | undefined, timeZone: string): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  const parts = getDateParts(new Date(value), resolveBusinessTimeZone(timeZone));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function businessDateToIso(value: string, timeZone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const localMidnightAsUtc = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const guess = new Date(localMidnightAsUtc);
  const zone = resolveBusinessTimeZone(timeZone);
  const parts = getDateParts(guess, zone);
  const representedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  );
  const offset = representedAsUtc - localMidnightAsUtc;
  const instant = new Date(localMidnightAsUtc - offset);
  const verifiedParts = getDateParts(instant, zone);

  if (
    verifiedParts.year !== year
    || verifiedParts.month !== month
    || verifiedParts.day !== day
    || verifiedParts.hour !== "00"
    || verifiedParts.minute !== "00"
  ) return null;

  return instant.toISOString();
}

export function formatBusinessDate(value: string, timeZone: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Dates not selected";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: resolveBusinessTimeZone(timeZone),
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(timestamp);
}

export function formatBusinessDateTime(value: string | undefined, timeZone: string): string {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  if (!Number.isFinite(timestamp)) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: resolveBusinessTimeZone(timeZone),
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(timestamp);
}

export function durationInBusinessDays(startIso: string, endIso: string): number | null {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.ceil((end - start) / 86_400_000);
}
