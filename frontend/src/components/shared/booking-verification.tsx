"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
      remove: (id: string) => void;
    };
  }
}

export function BookingVerification({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  useEffect(() => {
    if (!loaded || !sitekey || !container.current || !window.turnstile) return;
    const widget = window.turnstile.render(container.current, {
      sitekey, action: "rental-inquiry", callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => { onToken(""); setFailed(true); },
    });
    return () => { window.turnstile?.remove(widget); onToken(""); };
  }, [loaded, sitekey, onToken]);
  if (!sitekey) return <p role="status" className="text-sm text-muted-foreground">Online booking is temporarily unavailable. Please contact the rental team.</p>;
  return <div className="space-y-2">
    <Script id="booking-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setLoaded(true)} onError={() => setFailed(true)} />
    <div ref={container} />
    {failed && <p role="alert" className="text-sm text-destructive">Verification could not load. Reopen this booking form to try again.</p>}
  </div>;
}
