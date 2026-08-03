"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { VehicleResponse, CreateVehicleRequest } from "@/lib/types";

export function useVehicles() {
  return useQuery<VehicleResponse[]>({
    queryKey: ["vehicles"],
    queryFn: () => api.get("/api/vehicles"),
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVehicleRequest) => api.post<VehicleResponse>("/api/vehicles", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
    onError: () => {
      toast.error("Failed to add vehicle.");
    },
  });
}
