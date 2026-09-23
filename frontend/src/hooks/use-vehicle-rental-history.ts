"use client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useActiveBusiness } from "./use-active-business";
interface VehicleRentalHistoryItem { id: string; reservationId: string; customerName: string; actualStart?: string; actualEnd?: string; odometerStart?: number; odometerEnd?: number; status: string }
export function useVehicleRentalHistory(vehicleId: string) { const { businessId } = useActiveBusiness(); const data = useQuery(api.rentals.historyByVehicle, businessId && vehicleId ? { businessId, vehicleId: vehicleId as Id<"vehicles"> } : "skip"); return { data: data?.map((r): VehicleRentalHistoryItem => ({ id: r._id, reservationId: r.reservationId, customerName: "", actualStart: r.actualStart, actualEnd: r.actualEnd, odometerStart: r.odometerStart, odometerEnd: r.odometerEnd, status: r.status })), isLoading: data === undefined, isError: false }; }
