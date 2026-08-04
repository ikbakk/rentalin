"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { RentalResponse, CompleteRentalRequest } from "@/lib/types";

export function useRentals() {
  return useQuery<RentalResponse[]>({
    queryKey: ["rentals"],
    queryFn: () => api.get("/api/rentals"),
  });
}

export function useActiveRentals() {
  return useQuery<RentalResponse[]>({
    queryKey: ["rentals", "active"],
    queryFn: () => api.get("/api/rentals?status=Active"),
  });
}

export function useCompleteRental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CompleteRentalRequest) =>
      api.post<RentalResponse>(`/api/rentals/${data.rentalId}/complete`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => {
      toast.error("Failed to complete rental.");
    },
  });
}

export function useRentalById(id: string) {
  return useQuery<RentalResponse>({
    queryKey: ["rentals", id],
    queryFn: () => api.get(`/api/rentals/${id}`),
    enabled: !!id,
  });
}
