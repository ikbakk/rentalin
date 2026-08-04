"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { publicApi } from "@/lib/api";

export interface CreatePublicInquiryRequest {
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export function useCreatePublicInquiry(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePublicInquiryRequest) =>
      publicApi.post("/api/public/" + slug + "/inquiries", data),
    onSuccess: () => {
      toast.success("Inquiry sent!");
      queryClient.invalidateQueries({ queryKey: ["public-vehicles", slug] });
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to submit inquiry.");
    },
  });
}
