"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BusinessResponse } from "@/lib/types";

export function useBusiness(businessId: string) {
  return useQuery<BusinessResponse | undefined>({
    queryKey: ["business", businessId],
    queryFn: async () => {
      const businesses = await api.get<BusinessResponse[]>("/api/businesses");
      return businesses.find((b) => b.id === businessId);
    },
    enabled: !!businessId,
  });
}
