"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type {
  ReservationResponse,
  RentalResponse,
  CreateReservationRequest,
  StartRentalRequest,
  CompleteRentalRequest,
} from "@/lib/types";

export function useReservations() {
  return useQuery<ReservationResponse[]>({
    queryKey: ["reservations"],
    queryFn: () => api.get("/api/reservations"),
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReservationRequest) =>
      api.post<ReservationResponse>("/api/reservations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => {
      toast.error("Failed to create reservation.");
    },
  });
}

export function useStartRental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartRentalRequest) =>
      api.post<RentalResponse>(`/api/reservations/${data.reservationId}/start-rental`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => {
      toast.error("Failed to start rental.");
    },
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
