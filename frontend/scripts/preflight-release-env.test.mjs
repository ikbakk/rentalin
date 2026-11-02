import assert from "node:assert/strict";
import { test } from "node:test";
import { validateReleaseEnvironment } from "./preflight-release-env.mjs";

const validEnvironment = {
  NEXT_PUBLIC_CONVEX_URL: "https://rentalin-staging.convex.cloud",
  CONVEX_SITE_URL: "https://rentalin-staging.convex.site",
  NEXT_PUBLIC_FRONTEND_URL: "https://staging.rentalin.example",
};

test("accepts HTTPS origins for one Convex deployment", () => {
  assert.equal(validateReleaseEnvironment(validEnvironment), true);
});

test("rejects missing release origins", () => {
  assert.throws(() => validateReleaseEnvironment({}), /NEXT_PUBLIC_CONVEX_URL is required/);
});

test("rejects HTTP and local release origins", () => {
  assert.throws(() => validateReleaseEnvironment({
    ...validEnvironment,
    NEXT_PUBLIC_FRONTEND_URL: "http://localhost:3000",
  }), /must use HTTPS|cannot point to a local host/);
});

test("rejects Convex URLs that refer to different deployments", () => {
  assert.throws(() => validateReleaseEnvironment({
    ...validEnvironment,
    CONVEX_SITE_URL: "https://another-deployment.convex.site",
  }), /same Convex deployment/);
});

test("rejects URL paths and embedded credentials", () => {
  assert.throws(() => validateReleaseEnvironment({
    ...validEnvironment,
    NEXT_PUBLIC_FRONTEND_URL: "https://user:password@staging.rentalin.example/app",
  }), /only an origin/);
});
