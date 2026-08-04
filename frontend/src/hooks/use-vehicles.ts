"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { VehicleResponse, CreateVehicleRequest, UpdateVehicleRequest } from "@/lib/types";

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

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateVehicleRequest) => api.put<VehicleResponse>(`/api/vehicles/${request.id}`, request),
    onSuccess: (_data, request) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", request.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to update vehicle");
    },
  });
}
