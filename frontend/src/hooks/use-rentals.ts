"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getAuth } from "@/lib/auth";
import type { RentalResponse, CompleteRentalRequest } from "@/lib/types";

const mapRental = (r: any): RentalResponse => ({ id: r._id, reservationId: r.reservationId, vehicleId: r.vehicleId, vehicleSummary: "", customerId: r.customerId ?? "", customerName: "", actualStart: r.actualStart, actualEnd: r.actualEnd, status: r.status === "active" ? "Active" : "Completed" });

export function useRentals() {
  const externalId = getAuth()?.businessId;
  const rentals = useQuery(api.rentals.listByExternalId, externalId ? { externalId } : "skip");
  return { data: rentals?.map(mapRental), isLoading: rentals === undefined, isError: false };
}

export function useActiveRentals() {
  const all = useRentals();
  return { ...all, data: all.data?.filter(r => r.status === "Active") };
}

export function useCompleteRental() {
  const complete = useMutation(api.rentals.complete);
  return { mutate: (data: CompleteRentalRequest) => complete({ rentalId: data.rentalId as Id<"rentals">, odometerEnd: data.odometerEnd }), mutateAsync: (data: CompleteRentalRequest) => complete({ rentalId: data.rentalId as Id<"rentals">, odometerEnd: data.odometerEnd }), isPending: false } as any;
}

export function useRentalById(id: string) {
  const all = useRentals();
  return { data: all.data?.find(r => r.id === id), isLoading: all.isLoading, isError: false };
}
