"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface PublicVehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  seatingCapacity: number;
  dailyRateAmount: number;
  dailyRateCurrency: string;
}

export function usePublicVehiclesBySlug(slug: string) {
  const vehicles = useQuery(api.vehicles.listPublicByBusinessSlug, slug ? { slug } : "skip");
  return {
    data: vehicles?.map((vehicle) => ({
      id: vehicle._id,
      licensePlate: vehicle.plateNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year ?? 0,
      color: vehicle.color ?? "",
      seatingCapacity: vehicle.seatingCapacity ?? 0,
      dailyRateAmount: vehicle.dailyRate ?? 0,
      dailyRateCurrency: "IDR",
    })),
    isLoading: vehicles === undefined,
    isError: false,
  };
}
