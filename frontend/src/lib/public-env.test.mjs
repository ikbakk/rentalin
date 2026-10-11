import assert from "node:assert/strict";
import { test } from "node:test";
import { requirePublicEnv } from "./public-env.mjs";

test("returns a trimmed configured public value", () => {
  assert.equal(requirePublicEnv(" https://rentalin.example ", "NEXT_PUBLIC_FRONTEND_URL"), "https://rentalin.example");
});

test("names a missing public variable in its error", () => {
  assert.throws(() => requirePublicEnv(undefined, "NEXT_PUBLIC_CONVEX_URL"), /NEXT_PUBLIC_CONVEX_URL is required/);
});

test("rejects whitespace-only values", () => {
  assert.throws(() => requirePublicEnv("   ", "NEXT_PUBLIC_FRONTEND_URL"), /NEXT_PUBLIC_FRONTEND_URL is required/);
});
