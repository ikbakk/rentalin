"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { ReservationResponse, RentalResponse, CreateReservationRequest, StartRentalRequest } from "@/lib/types";
export { useRentals, useActiveRentals, useCompleteRental } from "./use-rentals";

const mapReservation = (r: any): ReservationResponse => ({ id: r._id, inquiryId: r.inquiryId ?? "", customerId: r.customerId ?? "", customerName: "", vehicleId: r.vehicleId, vehicleSummary: "", startDate: r.startDate, endDate: r.endDate, estimatedCost: r.estimatedCost, currency: r.currency, status: r.status });

export function useReservations() {
  const externalId = getAuth()?.businessId;
  const data = useQuery(api.reservations.list, externalId ? { externalId } : "skip");
  return { data: data?.map(mapReservation), isLoading: data === undefined, isError: false };
}

export function useCreateReservation() {
  const create = useMutation(api.reservations.create);
  return { mutateAsync: (data: CreateReservationRequest) => { const externalId = getAuth()?.businessId; if (!externalId) throw new Error("Business session not found"); return create({ ...data, externalId, inquiryId: data.inquiryId as Id<"inquiries">, vehicleId: "" as Id<"vehicles">, startDate: "", endDate: "" }); }, isPending: false };
}

export function useStartRental() { const start = useMutation(api.rentals.start); return { mutate: (data: StartRentalRequest) => start({ reservationId: data.reservationId as Id<"reservations">, odometerStart: data.odometerStart }), mutateAsync: (data: StartRentalRequest) => start({ reservationId: data.reservationId as Id<"reservations">, odometerStart: data.odometerStart }), isPending: false } as any; }
export function useReservationById(id: string) { const all = useReservations(); return { data: all.data?.find(r => r.id === id), isLoading: all.isLoading, isError: false, error: undefined }; }
function transition(status: "preRental" | "ready") { const update = useMutation(api.reservations.setStatus); return { mutate: (id: string) => update({ id: id as Id<"reservations">, status }), mutateAsync: (id: string) => update({ id: id as Id<"reservations">, status }), isPending: false }; }
export function usePrepareReservation() { return transition("preRental"); }
export function useReadyForHandover() { return transition("ready"); }
