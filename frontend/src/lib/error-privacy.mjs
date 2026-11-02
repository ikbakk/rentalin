/** Allowlist error metadata: never send booking URLs, request data or PII. */
export function scrubErrorEvent(event) {
  const clean = {
    event_id: event.event_id, timestamp: event.timestamp, platform: event.platform,
    level: event.level, release: event.release, environment: event.environment,
    tags: { application: "rentalin" },
  };
  if (event.exception?.values) clean.exception = {
    values: event.exception.values.map(exception => ({
      type: "Error", value: "Rentalin application error",
      stacktrace: exception.stacktrace ? { frames: exception.stacktrace.frames?.map(frame => ({
        filename: frame.filename?.split(/[?#]/)[0]?.replace(/\/(booking|tx)\/[^/]+/g, "/$1/[token]"),
        function: frame.function, lineno: frame.lineno, colno: frame.colno, in_app: frame.in_app,
      })) } : undefined,
    })),
  };
  return clean;
}
