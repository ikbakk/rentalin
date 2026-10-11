"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function usePublicVehiclesBySlug(slug: string) {
  const vehicles = useQuery(api.vehicles.listPublicByBusinessSlug, slug ? { slug } : "skip");
  return {
    data: vehicles?.map((vehicle) => ({
      id: vehicle._id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year ?? 0,
      color: vehicle.color ?? "",
      seatingCapacity: vehicle.seatingCapacity ?? 0,
      dailyRateAmount: vehicle.dailyRate ?? 0,
      dailyRateCurrency: vehicle.currency,
    })),
    isLoading: vehicles === undefined,
    isError: false,
  };
}
