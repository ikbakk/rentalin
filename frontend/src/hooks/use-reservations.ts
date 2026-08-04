"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type {
  ReservationResponse,
  RentalResponse,
  CreateReservationRequest,
  StartRentalRequest,
} from "@/lib/types";

export { useRentals, useActiveRentals, useCompleteRental } from "./use-rentals";

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

export function useReservationById(id: string) {
  return useQuery<ReservationResponse>({
    queryKey: ["reservations", id],
    queryFn: () => api.get(`/api/reservations/${id}`),
    enabled: !!id,
  });
}

export function usePrepareReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/reservations/${id}/prepare`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => toast.error("Failed to prepare reservation."),
  });
}

export function useReadyForHandover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/reservations/${id}/ready-for-handover`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => toast.error("Failed to mark reservation ready."),
  });
}
