import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { safeObjectPath, verifyBackup } from "./backup.mjs";
const root = await mkdtemp(join(tmpdir(), "rentalin-backup-test-"));
try {
  for (const key of ["../secret", "/absolute", "inspections/../../secret", "inspections\\secret"]) assert.throws(() => safeObjectPath(root, key));
  const zip = Buffer.from("disposable snapshot fixture");
  await writeFile(join(root, "convex.zip"), zip);
  await mkdir(join(root, "files", "inspections", "tenant"), { recursive: true });
  const photo = Buffer.from("disposable image fixture");
  await writeFile(join(root, "files", "inspections", "tenant", "photo"), photo);
  const sha256 = value => createHash("sha256").update(value).digest("hex");
  const manifest = { version: 1, deployment: "test-source", bucket: "test-source", convexSha256: sha256(zip), objects: [{ key: "inspections/tenant/photo", sha256: sha256(photo), size: photo.length }] };
  await writeFile(join(root, "manifest.json"), JSON.stringify(manifest));
  assert.equal((await verifyBackup(root)).objects.length, 1);
  await writeFile(join(root, "files", "inspections", "tenant", "photo"), "corrupted");
  await assert.rejects(verifyBackup(root), /checksum/);
  await writeFile(join(root, "manifest.json"), JSON.stringify({ ...manifest, objects: [{ key: "../secret", sha256: "no", size: 1 }] }));
  await assert.rejects(verifyBackup(root), /Unsafe/);
} finally { await rm(root, { recursive: true, force: true }); }
console.log("Backup checksum and path validation tests passed.");
