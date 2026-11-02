"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

export function InspectionPhoto({ reference, alt, className }: { reference: string; alt: string; className?: string }) {
  const readImage = useAction(api.r2.readImage);
  const [signed, setSigned] = useState<{ reference: string; url: string } | null>(null);
  const [failedReference, setFailedReference] = useState<string | null>(null);
  useEffect(() => {
    if (!reference.startsWith("r2:")) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const result = await readImage({ id: reference.slice(3) as Id<"r2Uploads"> });
        if (!cancelled) { setSigned({ reference, url: result.url }); setFailedReference(null); }
      } catch {
        if (!cancelled) { setSigned(null); setFailedReference(reference); }
      }
    };
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 4 * 60 * 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [reference, readImage]);

  const url = reference.startsWith("r2:") ? (signed?.reference === reference ? signed.url : null) : reference;
  if (failedReference === reference) return <span className="text-xs text-muted-foreground" role="status">Photo unavailable</span>;
  if (!url) return <Skeleton className={className} aria-label="Loading photo" />;
  // Private R2 URLs expire and must not be cached by Next's image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} referrerPolicy="no-referrer" />;
}
