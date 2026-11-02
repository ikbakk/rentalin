import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) throw new Error("Missing backend URL");
    const client = new ConvexHttpClient(url, { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }) });
    const backend = await client.query(api.health.ping, {});
    return Response.json({ ok: backend.ok }, { status: backend.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
