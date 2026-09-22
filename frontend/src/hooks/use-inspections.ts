"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getAuth } from "@/lib/auth";
import type { InspectionResponse } from "@/lib/types";

const mapInspection = (i: any): InspectionResponse => ({ id: i._id, rentalId: i.rentalId, vehicleId: i.vehicleId, inspectionType: i.inspectionType, notes: i.notes, photoUrls: i.photoUrls, status: i.status, inspectionDate: i.inspectionDate });

export function useInspections() {
  const externalId = getAuth()?.businessId;
  const data = useQuery(api.inspections.list, externalId ? { externalId } : "skip");
  return { data: data?.map(mapInspection), isLoading: data === undefined, isError: false };
}

export function useCreateInspection() { const create = useMutation(api.inspections.create); return { mutate: (data: { rentalId: string; inspectionType: "PreRental" | "PostRental" }) => create({ ...data, externalId: getAuth()?.businessId ?? "", rentalId: data.rentalId as Id<"rentals"> }), mutateAsync: (data: { rentalId: string; inspectionType: "PreRental" | "PostRental" }) => create({ ...data, externalId: getAuth()?.businessId ?? "", rentalId: data.rentalId as Id<"rentals"> }), isPending: false }; }
export function useCompleteInspection() { const complete = useMutation(api.inspections.complete); return { mutate: ({ id, photoUrls }: { id: string; photoUrls?: string[] }) => complete({ id: id as Id<"inspections">, photoUrls: photoUrls ?? [] }), mutateAsync: ({ id, photoUrls }: { id: string; photoUrls?: string[] }) => complete({ id: id as Id<"inspections">, photoUrls: photoUrls ?? [] }), isPending: false }; }
export function useFailInspection() { const fail = useMutation(api.inspections.fail); return { mutate: ({ id, reason }: { id: string; reason: string }) => fail({ id: id as Id<"inspections">, reason }), mutateAsync: ({ id, reason }: { id: string; reason: string }) => fail({ id: id as Id<"inspections">, reason }), isPending: false }; }
export function useInspectionById(id: string) { const all = useInspections(); return { data: all.data?.find(i => i.id === id), isLoading: all.isLoading, isError: false }; }
