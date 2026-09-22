"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { getAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { CreateVehicleRequest, UpdateVehicleRequest, VehicleResponse } from "@/lib/types";

function toVehicleResponse(vehicle: Doc<"vehicles">): VehicleResponse {
  return {
    id: vehicle._id,
    licensePlate: vehicle.plateNumber,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year ?? 0,
    color: vehicle.color ?? "",
    seatingCapacity: vehicle.seatingCapacity ?? 0,
    dailyRateAmount: vehicle.dailyRate ?? 0,
    dailyRateCurrency: vehicle.currency ?? "IDR",
    status: vehicle.status === "inactive" ? "Retired" : vehicle.status[0].toUpperCase() + vehicle.status.slice(1) as VehicleResponse["status"],
    businessId: vehicle.businessId,
  };
}

export function useVehicles() {
  const businessId = getAuth()?.businessId;
  const vehicles = useQuery(
    api.fleet.listByBusinessExternalId,
    businessId ? { externalId: businessId } : "skip",
  );
  return { data: vehicles?.map(toVehicleResponse), isLoading: vehicles === undefined, isError: false };
}

export function useCreateVehicle() {
  const create = useMutation(api.fleet.create);
  return {
    mutateAsync: async (data: CreateVehicleRequest) => {
      const businessId = getAuth()?.businessId;
      if (!businessId) throw new Error("Business session not found");
      try {
        return await create({ externalId: businessId, ...data });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to add vehicle.");
        throw error;
      }
    },
    isPending: false,
  };
}

export function useUpdateVehicle() {
  const update = useMutation(api.fleet.update);
  return {
    mutateAsync: async (request: UpdateVehicleRequest) => {
      try {
        return await update({ ...request, id: request.id as Id<"vehicles"> });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update vehicle");
        throw error;
      }
    },
    isPending: false,
  };
}
