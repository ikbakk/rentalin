"use client";

import { useConvexAuth } from "convex/react";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) window.location.href = "/login";
  }, [isLoading, isAuthenticated]);
  if (isLoading || !isAuthenticated) return null;
  return <>{children}</>;
}
