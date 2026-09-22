"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useActiveBusiness } from "./use-active-business";
import { toast } from "sonner";
import type { InquiryResponse, CreateInquiryRequest } from "@/lib/types";

const mapInquiry = (item: any): InquiryResponse => ({
  id: item._id,
  customerId: item.customerId ?? "",
  customerName: item.customerName,
  vehicleId: item.vehicleId,
  vehicleSummary: "",
  startDate: item.startDate,
  endDate: item.endDate,
  status: item.status[0].toUpperCase() + item.status.slice(1) as InquiryResponse["status"],
  notes: item.notes,
});

export function useInquiries() {
  const { businessId } = useActiveBusiness();
  const inquiries = useQuery(api.operations.listInquiries, businessId ? { businessId } : "skip");
  return { data: inquiries?.map(mapInquiry), isLoading: inquiries === undefined, isError: false };
}

export function useCreateInquiry() {
  const create = useMutation(api.operations.createInquiry);
  const { businessId } = useActiveBusiness();
  const submit = async (data: CreateInquiryRequest) => {
    if (!businessId) throw new Error("Business session not found");
    try { return await create({ ...data, businessId, customerName: data.customerName ?? "", vehicleId: data.vehicleId as Id<"vehicles">, customerId: data.customerId as Id<"customers"> | undefined }); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Failed to create inquiry."); throw error; }
  };
  return { mutate: submit, mutateAsync: submit, isPending: false };
}

function statusMutation(status: "converted" | "cancelled") {
  const update = useMutation(api.operations.setInquiryStatus);
  const submit = (id: string) => update({ id: id as Id<"inquiries">, status });
  return { mutate: submit, mutateAsync: submit, isPending: false };
}

export function useConfirmInquiry() { return statusMutation("converted"); }
export function useCancelInquiry() { return statusMutation("cancelled"); }

export function useInquiryById(id: string) {
  const inquiries = useInquiries();
  return { data: inquiries.data?.find((item) => item.id === id), isLoading: inquiries.isLoading, isError: false };
}
