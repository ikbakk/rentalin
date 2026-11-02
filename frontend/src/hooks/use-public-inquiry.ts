"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useState } from "react";

export interface CreatePublicInquiryRequest {
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  notes?: string;
  turnstileToken: string;
}

export function useCreatePublicInquiry(slug: string) {
  const createInquiry = useAction(api.inquiries.createPublic);
  const [isPending, setIsPending] = useState(false);
  const submit = (data: CreatePublicInquiryRequest) => {
    setIsPending(true);
    return createInquiry({ ...data, slug, vehicleId: data.vehicleId as Id<"vehicles"> })
      .finally(() => setIsPending(false));
  };

  return {
    mutate: submit,
    mutateAsync: submit,
    isPending,
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to submit inquiry.");
    },
  };
}
