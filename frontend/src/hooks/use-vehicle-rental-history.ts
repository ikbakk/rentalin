"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface VehicleRentalHistoryItem {
  id: string;
  reservationId: string;
  customerName: string;
  actualStart?: string;
  actualEnd?: string;
  odometerStart?: number;
  odometerEnd?: number;
  status: string;
}

export function useVehicleRentalHistory(vehicleId: string) {
  return useQuery<VehicleRentalHistoryItem[]>({
    queryKey: ["vehicle-rental-history", vehicleId],
    queryFn: () => api.get(`/api/rentals/history/${vehicleId}`),
    enabled: !!vehicleId,
  });
}
