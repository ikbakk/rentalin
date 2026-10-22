"use node";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { READ_URL_SECONDS, UPLOAD_URL_SECONDS, validateImageBytes } from "../r2Rules";

export function r2Storage() {
  const required = (name: string) => {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`R2 storage is not configured: ${name}`);
    return value;
  };
  const accountId = required("R2_ACCOUNT_ID");
  if (!/^[a-f0-9]{32}$/.test(accountId)) throw new Error("Invalid R2_ACCOUNT_ID");
  const bucket = required("R2_BUCKET_NAME");
  const client = new S3Client({
    forcePathStyle: true, region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: required("R2_ACCESS_KEY_ID"), secretAccessKey: required("R2_SECRET_ACCESS_KEY") },
    requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED",
  });
  return {
    uploadUrl: (key: string, type: string, size: number) => getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: type, ContentLength: size }), { expiresIn: UPLOAD_URL_SECONDS, signableHeaders: new Set(["content-type", "content-length"]) }),
    readUrl: (key: string) => getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseCacheControl: "private, no-store" }), { expiresIn: READ_URL_SECONDS }),
    async promote(stagingKey: string, finalKey: string, type: string, size: number) {
      const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: stagingKey }));
      if (head.ContentLength !== size || head.ContentType !== type || !head.ETag) throw new Error("Uploaded image size or type does not match");
      // IfMatch pins the download to the metadata we checked. Never copy mutable
      // staging bytes after validation; upload the exact validated bytes instead.
      const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: stagingKey, IfMatch: head.ETag }));
      if (!object.Body) throw new Error("Uploaded image is empty");
      const bytes = await object.Body.transformToByteArray();
      if (bytes.length !== size) throw new Error("Uploaded image size does not match");
      validateImageBytes(type, bytes);
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: finalKey, Body: bytes, ContentType: type, CacheControl: "private, no-store" }));
    },
    async remove(key: string) { await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })); },
  };
}
