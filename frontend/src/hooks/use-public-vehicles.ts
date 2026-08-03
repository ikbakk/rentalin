"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

export function usePublicVehicles() {
  return useQuery<PublicVehicle[]>({
    queryKey: ["public-vehicles"],
    queryFn: () => api.get("/api/public/vehicles"),
  });
}
