"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useActiveBusiness } from "./use-active-business";
import { usePendingMutation } from "./use-pending-mutation";
import type { RentalResponse, CompleteRentalRequest } from "@/lib/types";

type RentalRecord = FunctionReturnType<typeof api.rentals.list>[number];

function mapRental(r: RentalRecord): RentalResponse {
  return {
    id: r._id,
    reservationId: r.reservationId,
    vehicleId: r.vehicleId,
    vehicleSummary: r.vehicleSummary,
    customerId: r.customerId ?? "",
    customerName: r.customerName,
    actualStart: r.actualStart,
    actualEnd: r.actualEnd,
    odometerStart: r.odometerStart,
    odometerEnd: r.odometerEnd,
    status: r.status === "active" ? "Active" : "Completed",
  };
}

export function useRentals() {
  const { businessId } = useActiveBusiness();
  const rentals = useQuery(api.rentals.list, businessId ? { businessId } : "skip");
  return { data: rentals?.map(mapRental), isLoading: rentals === undefined };
}

export function useActiveRentals() {
  const all = useRentals();
  return { ...all, data: all.data?.filter(r => r.status === "Active") };
}

export function useCompleteRental() {
  const complete = useMutation(api.rentals.complete);
  return usePendingMutation((data: CompleteRentalRequest) => complete({
    rentalId: data.rentalId as Id<"rentals">,
    odometerEnd: data.odometerEnd,
  }));
}

export function useRentalById(id: string) {
  const all = useRentals();
  return { data: all.data?.find((rental) => rental.id === id), isLoading: all.isLoading };
}
