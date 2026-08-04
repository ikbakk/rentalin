"use client";

import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

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
  return useQuery<PublicVehicle[]>({
    queryKey: ["public-vehicles", slug],
    queryFn: () => publicApi.get("/api/public/" + slug + "/vehicles"),
  });
}
