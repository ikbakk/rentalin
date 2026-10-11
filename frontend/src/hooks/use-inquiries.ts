"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useActiveBusiness } from "./use-active-business";
import { usePendingMutation } from "./use-pending-mutation";
import type { InquiryResponse, CreateInquiryRequest } from "@/lib/types";

type InquiryRecord = FunctionReturnType<typeof api.operations.listInquiries>[number];
const inquiryStatuses = { new: "New", contacted: "Contacted", converted: "Converted", cancelled: "Cancelled" } as const;

function mapInquiry(item: InquiryRecord): InquiryResponse {
  return {
    id: item._id,
    customerId: item.customerId ?? "",
    customerName: item.customerName,
    customerPhone: item.customerPhone,
    vehicleId: item.vehicleId,
    vehicleSummary: item.vehicleSummary,
    startDate: item.startDate,
    endDate: item.endDate,
    status: inquiryStatuses[item.status],
    notes: item.notes,
  };
}

export function useInquiries() {
  const { businessId } = useActiveBusiness();
  const inquiries = useQuery(api.operations.listInquiries, businessId ? { businessId } : "skip");
  return { data: inquiries?.map(mapInquiry), isLoading: inquiries === undefined };
}

export function useCreateInquiry() {
  const create = useMutation(api.operations.createInquiry);
  const { businessId } = useActiveBusiness();
  return usePendingMutation(async (data: CreateInquiryRequest) => {
    if (!businessId) throw new Error("Business session not found");
    return create({
      ...data,
      businessId,
      customerName: data.customerName ?? "",
      vehicleId: data.vehicleId as Id<"vehicles">,
      customerId: data.customerId ? data.customerId as Id<"customers"> : undefined,
    });
  });
}

function useInquiryStatusMutation(status: "converted" | "cancelled") {
  const update = useMutation(api.operations.setInquiryStatus);
  return usePendingMutation((id: string) => update({ id: id as Id<"inquiries">, status }));
}

export function useConfirmInquiry() { return useInquiryStatusMutation("converted"); }
export function useCancelInquiry() { return useInquiryStatusMutation("cancelled"); }

export function useInquiryById(id: string) {
  const inquiries = useInquiries();
  return { data: inquiries.data?.find((item) => item.id === id), isLoading: inquiries.isLoading };
}
