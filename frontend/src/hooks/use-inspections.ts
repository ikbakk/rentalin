"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useActiveBusiness } from "./use-active-business";
import { usePendingMutation } from "./use-pending-mutation";
import type { InspectionResponse } from "@/lib/types";

type InspectionRecord = FunctionReturnType<typeof api.inspections.list>[number];

const mapInspection = (inspection: InspectionRecord): InspectionResponse => ({
  id: inspection._id,
  rentalId: inspection.rentalId ?? inspection.reservationId ?? "",
  reservationId: inspection.reservationId,
  vehicleId: inspection.vehicleId,
  inspectionType: inspection.inspectionType,
  notes: inspection.notes,
  photoUrls: inspection.photoUrls,
  photoStorageIds: inspection.photoStorageIds,
  status: inspection.status,
  inspectionDate: inspection.inspectionDate,
});

export function useInspections() {
  const { businessId } = useActiveBusiness();
  const data = useQuery(api.inspections.list, businessId ? { businessId } : "skip");
  return { data: data?.map(mapInspection), isLoading: data === undefined };
}

export function useCreateInspection() {
  const create = useMutation(api.inspections.create);
  const { businessId } = useActiveBusiness();

  return usePendingMutation(async (data: {
    rentalId?: string;
    reservationId?: string;
    inspectionType: "PreRental" | "PostRental";
  }) => {
    if (!businessId) throw new Error("Business session not found");
    return create({
      ...data,
      businessId,
      rentalId: data.rentalId as Id<"rentals"> | undefined,
      reservationId: data.reservationId as Id<"reservations"> | undefined,
    });
  });
}

export function useCompleteInspection() {
  const complete = useMutation(api.inspections.complete);
  return usePendingMutation((data: { id: string; photoUrls?: string[]; notes?: string }) =>
    complete({
      id: data.id as Id<"inspections">,
      photoUrls: data.photoUrls ?? [],
      notes: data.notes,
    }),
  );
}

export function useFailInspection() {
  const fail = useMutation(api.inspections.fail);
  return usePendingMutation((data: { id: string; reason: string }) =>
    fail({ id: data.id as Id<"inspections">, reason: data.reason }),
  );
}

export function useInspectionById(id: string) {
  const all = useInspections();
  return {
    data: all.data?.find((inspection) => inspection.id === id),
    isLoading: all.isLoading,
  };
}
