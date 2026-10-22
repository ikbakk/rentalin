import assert from "node:assert/strict";
import { scrubErrorEvent } from "./error-privacy.mjs";
const result = scrubErrorEvent({
  event_id: "123", platform: "javascript", message: "customer-name secret-token", request: { url: "https://app/booking/secret-token" },
  user: { email: "customer@example.test" }, extra: { payload: "secret-token" }, breadcrumbs: [{ message: "customer-name" }],
  exception: { values: [{ type: "Error", value: "customer-name secret-token", stacktrace: { frames: [{ filename: "https://app/bundle.js?token=secret-token", function: "submit", vars: { customer: "customer-name" } }] } }] },
});
const serialized = JSON.stringify(result);
for (const sensitive of ["customer-name", "secret-token", "customer@example.test"]) assert.ok(!serialized.includes(sensitive));
assert.equal(result.exception.values[0].stacktrace.frames[0].function, "submit");
assert.equal(result.event_id, "123");
console.log("Error event privacy tests passed.");
