"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useActiveBusiness } from "./use-active-business";
import { usePendingMutation } from "./use-pending-mutation";
import type { ReservationResponse, CreateReservationRequest, StartRentalRequest } from "@/lib/types";
export { useRentals, useActiveRentals, useCompleteRental } from "./use-rentals";

type ReservationRecord = FunctionReturnType<typeof api.reservations.list>[number];
const reservationStatuses = { confirmed: "Confirmed", preRental: "PreRental", ready: "Ready", active: "Active", cancelled: "Cancelled", completed: "Completed" } as const;
function mapReservation(r: ReservationRecord): ReservationResponse {
  return {
    id: r._id,
    inquiryId: r.inquiryId ?? "",
    customerId: r.customerId ?? "",
    customerName: r.customerName,
    vehicleId: r.vehicleId,
    vehicleSummary: r.vehicleSummary,
    startDate: r.startDate,
    endDate: r.endDate,
    estimatedCost: r.estimatedCost,
    currency: r.currency,
    status: reservationStatuses[r.status],
  };
}

export function useReservations() {
  const { businessId } = useActiveBusiness();
  const data = useQuery(api.reservations.list, businessId ? { businessId } : "skip");
  return { data: data?.map(mapReservation), isLoading: data === undefined };
}

export function useCreateReservation() {
  const create = useMutation(api.reservations.create);
  const { businessId } = useActiveBusiness();
  return usePendingMutation(async (data: CreateReservationRequest) => {
    if (!businessId) throw new Error("Business session not found");
    return create({
      ...data,
      businessId,
      inquiryId: data.inquiryId as Id<"inquiries">,
      vehicleId: data.vehicleId as Id<"vehicles">,
      customerId: data.customerId ? data.customerId as Id<"customers"> : undefined,
    });
  });
}

export function useStartRental() {
  const start = useMutation(api.rentals.start);
  return usePendingMutation((data: StartRentalRequest) => start({
    reservationId: data.reservationId as Id<"reservations">,
    odometerStart: data.odometerStart,
  }));
}

export function useReservationById(id: string) {
  const all = useReservations();
  return { data: all.data?.find((reservation) => reservation.id === id), isLoading: all.isLoading };
}

function useReservationStatusMutation(status: "preRental" | "ready") {
  const update = useMutation(api.reservations.setStatus);
  return usePendingMutation((id: string) => update({ id: id as Id<"reservations">, status }));
}

export function usePrepareReservation() { return useReservationStatusMutation("preRental"); }
export function useReadyForHandover() { return useReservationStatusMutation("ready"); }
