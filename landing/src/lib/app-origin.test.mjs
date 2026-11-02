import assert from "node:assert/strict";
import { validatePublicAppOrigin } from "./public-env.mjs";
assert.equal(validatePublicAppOrigin("https://app.example.test/"), "https://app.example.test");
for (const origin of [undefined, "", "http://app.example.test", "https://app.example.test/login", "https://user:pass@app.example.test", "https://app.example.test?next=evil"]) {
  assert.throws(() => validatePublicAppOrigin(origin));
}
console.log("Landing app origin tests passed.");
