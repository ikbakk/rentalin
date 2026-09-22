"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } }
  }));

  const content = (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );

  return convex ? <ConvexAuthProvider client={convex}>{content}</ConvexAuthProvider> : content;
}
