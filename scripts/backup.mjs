import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile, lstat } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

export function safeObjectPath(root, key) {
  if (!key || key.startsWith("/") || key.includes("\\") || key.split("/").some(part => !part || part === "." || part === "..")) throw new Error("Unsafe backup object path");
  return join(root, "files", ...key.split("/"));
}
async function checksum(path) {
  if (!(await lstat(path)).isFile()) throw new Error("Backup entry must be a regular file");
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
export async function verifyBackup(root) {
  const manifest = JSON.parse(await readFile(join(root, "manifest.json"), "utf8"));
  if (manifest.version !== 1 || !Array.isArray(manifest.objects)) throw new Error("Unsupported backup manifest");
  if (await checksum(join(root, "convex.zip")) !== manifest.convexSha256) throw new Error("Convex backup checksum mismatch");
  for (const object of manifest.objects) {
    const path = safeObjectPath(root, object.key);
    if (await checksum(path) !== object.sha256 || (await lstat(path)).size !== object.size) throw new Error("R2 backup checksum mismatch");
  }
  return manifest;
}

async function backup(deployment, output) {
  if (!deployment || !output) throw new Error("Specify --deployment NAME and --output DIRECTORY; no deployment is chosen implicitly");
  const required = name => { const value = process.env[name]?.trim(); if (!value) throw new Error(`Missing ${name}`); return value; };
  const account = required("R2_ACCOUNT_ID");
  if (!/^[a-f0-9]{32}$/.test(account)) throw new Error("Invalid R2_ACCOUNT_ID");
  const bucket = required("R2_BUCKET_NAME");
  const client = new S3Client({ region: "auto", forcePathStyle: true, endpoint: `https://${account}.r2.cloudflarestorage.com`, credentials: { accessKeyId: required("R2_ACCESS_KEY_ID"), secretAccessKey: required("R2_SECRET_ACCESS_KEY") }, requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" });
  const root = resolve(output);
  await mkdir(dirname(root), { recursive: true, mode: 0o700 });
  await mkdir(root, { mode: 0o700 }); // refuse to overwrite an existing snapshot
  const result = spawnSync(process.execPath, [resolve("node_modules/convex/bin/main.js"), "export", "--deployment", deployment, "--include-file-storage", "--path", join(root, "convex.zip")], { stdio: "inherit" });
  if (result.status !== 0) throw new Error("Convex export failed; no complete backup was created");
  const manifest = { version: 1, createdAt: new Date().toISOString(), deployment, bucket, convexSha256: await checksum(join(root, "convex.zip")), objects: [] };
  let continuation;
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "inspections/", ContinuationToken: continuation }));
    for (const object of page.Contents ?? []) {
      if (!object.Key) continue;
      const destination = safeObjectPath(root, object.Key);
      await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
      const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: object.Key, IfMatch: object.ETag }));
      if (!response.Body) throw new Error("Backup object missing");
      const hash = createHash("sha256");
      let size = 0;
      await pipeline(response.Body, new Transform({ transform(chunk, _encoding, callback) { hash.update(chunk); size += chunk.length; callback(null, chunk); } }), createWriteStream(destination, { flags: "wx", mode: 0o600 }));
      manifest.objects.push({ key: object.Key, sha256: hash.digest("hex"), size });
    }
    continuation = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuation);
  await writeFile(join(root, "manifest.json"), JSON.stringify(manifest, null, 2), { mode: 0o600, flag: "wx" });
  await verifyBackup(root);
  console.log("Snapshot created and checksums verified. Encrypt and copy it off-host; restore testing is still required.");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.env.RENTALIN_ENV_FILE) process.loadEnvFile(process.env.RENTALIN_ENV_FILE);
    const { values } = parseArgs({ options: { deployment: { type: "string" }, output: { type: "string" }, verify: { type: "string" } } });
    if (values.verify) { await verifyBackup(resolve(values.verify)); console.log("Snapshot checksums verified."); }
    else await backup(values.deployment, values.output);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
