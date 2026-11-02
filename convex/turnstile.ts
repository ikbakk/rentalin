export async function verifyTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const hostname = process.env.TURNSTILE_EXPECTED_HOSTNAME?.trim();
  if (!secret || !hostname) throw new Error("Booking verification is temporarily unavailable");
  if (!token || token.length > 2048) throw new Error("Complete the booking verification and try again");
  let response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }), signal: AbortSignal.timeout(10000),
    });
  } catch { throw new Error("Booking verification is temporarily unavailable"); }
  if (!response.ok) throw new Error("Booking verification is temporarily unavailable");
  const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
  if (result.success !== true || result.hostname !== hostname || result.action !== "rental-inquiry") {
    throw new Error("Complete the booking verification and try again");
  }
}
