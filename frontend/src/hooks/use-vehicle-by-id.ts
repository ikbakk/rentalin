"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { VehicleResponse } from "@/lib/types";

export function useVehicleById(id: string) {
  const vehicle = useQuery(api.fleet.get, id ? { id: id as Id<"vehicles"> } : "skip");
  return {
    data: vehicle ? ({ id: vehicle._id, licensePlate: vehicle.plateNumber, make: vehicle.make, model: vehicle.model, year: vehicle.year ?? 0, color: vehicle.color ?? "", seatingCapacity: vehicle.seatingCapacity ?? 0, dailyRateAmount: vehicle.dailyRate ?? 0, dailyRateCurrency: vehicle.currency ?? "IDR", status: vehicle.status === "inactive" ? "Retired" : vehicle.status[0].toUpperCase() + vehicle.status.slice(1) as VehicleResponse["status"], businessId: vehicle.businessId } satisfies VehicleResponse) : undefined,
    isLoading: vehicle === undefined,
    isError: false,
  };
}
