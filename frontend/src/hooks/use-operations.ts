"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OperationsSummary } from "@/lib/types";

export function useOperationsSummary() {
  return useQuery<OperationsSummary>({
    queryKey: ["operations-summary"],
    queryFn: () => api.get("/api/operations/summary"),
    refetchInterval: 30_000,
  });
}
