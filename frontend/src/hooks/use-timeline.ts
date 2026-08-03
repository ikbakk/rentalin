"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TimelineEntryResponse } from "@/lib/types";

export function useTimeline() {
  return useQuery<TimelineEntryResponse[]>({
    queryKey: ["timeline"],
    queryFn: () => api.get("/api/timeline"),
  });
}
