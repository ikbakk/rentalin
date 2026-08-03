"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VehicleResponse } from "@/lib/types";

export function useVehicleById(id: string) {
  return useQuery<VehicleResponse>({
    queryKey: ["vehicle", id],
    queryFn: () => api.get(`/api/vehicles/${id}`),
    enabled: !!id,
  });
}
