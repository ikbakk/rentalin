"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return <html lang="en"><body>
    <main className="mx-auto max-w-lg space-y-4 p-8">
      <h1 className="text-xl font-bold">Rentalin could not load this page</h1>
      <p>Please try again. If the problem continues, contact your rental administrator.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  </body></html>;
}
