"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { InspectionResponse } from "@/lib/types";

export function useInspections() {
  return useQuery<InspectionResponse[]>({
    queryKey: ["inspections"],
    queryFn: () => api.get("/api/inspections"),
  });
}

export function useCreateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rentalId: string; inspectionType: "PreRental" | "PostRental" }) =>
      api.post<InspectionResponse>("/api/inspections", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: () => {
      toast.error("Failed to create inspection.");
    },
  });
}

export function useCompleteInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, photoUrls }: { id: string; photoUrls?: string[] }) =>
      api.put<InspectionResponse>(`/api/inspections/${id}/complete`, {
        inspectionId: id,
        photoUrls: photoUrls ?? [],
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inspections"] }),
    onError: () => {
      toast.error("Failed to complete inspection.");
    },
  });
}

export function useInspectionById(id: string) {
  return useQuery<InspectionResponse>({
    queryKey: ["inspection", id],
    queryFn: () => api.get(`/api/inspections/${id}`),
    enabled: !!id,
  });
}

export function useFailInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put<InspectionResponse>(`/api/inspections/${id}/fail`, {
        inspectionId: id,
        reason,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inspections"] }),
    onError: () => {
      toast.error("Failed to fail inspection.");
    },
  });
}
