"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { useActiveBusiness } from "./use-active-business";
import { toast } from "sonner";
import type { CreateVehicleRequest, UpdateVehicleRequest, VehicleResponse } from "@/lib/types";
function map(v: Doc<"vehicles">): VehicleResponse { return { id: v._id, licensePlate: v.plateNumber, make: v.make, model: v.model, year: v.year ?? 0, color: v.color ?? "", seatingCapacity: v.seatingCapacity ?? 0, dailyRateAmount: v.dailyRate ?? 0, dailyRateCurrency: v.currency ?? "IDR", status: v.status === "inactive" ? "Retired" : v.status[0].toUpperCase() + v.status.slice(1) as VehicleResponse["status"], businessId: v.businessId }; }
export function useVehicles() { const { businessId } = useActiveBusiness(); const data = useQuery(api.fleet.list, businessId ? { businessId } : "skip"); return { data: data?.map(map), isLoading: data === undefined, isError: false }; }
export function useCreateVehicle() { const create = useMutation(api.fleet.create); const { businessId } = useActiveBusiness(); return { mutateAsync: async (data: CreateVehicleRequest) => { if (!businessId) throw new Error("Business session not found"); const { businessId: _, ...vehicle } = data; try { return await create({ businessId, ...vehicle }); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to add vehicle."); throw e; } }, isPending: false }; }
export function useUpdateVehicle() { const update = useMutation(api.fleet.update); return { mutateAsync: async (data: UpdateVehicleRequest) => update({ ...data, id: data.id as Id<"vehicles"> }), isPending: false }; }
