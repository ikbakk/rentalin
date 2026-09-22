"use client";

import { useConvexAuth } from "convex/react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) return null;
  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }
  return <>{children}</>;
}
