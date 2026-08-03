import { getAuthHeaders } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function uploadFile(
  file: File,
  referenceType: string,
  referenceId?: string
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("referenceType", referenceType);
  if (referenceId) form.append("referenceId", referenceId);

  const res = await fetch(`${BASE_URL}/api/uploads`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
}
