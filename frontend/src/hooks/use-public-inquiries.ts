"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface CreateInquiryPublicRequest {
  customerName?: string;
  customerPhone?: string;
  vehicleId: string;
  startDate: string;
  endDate?: string;
}

export function useCreateInquiryPublic() {
  return useMutation({
    mutationFn: (data: CreateInquiryPublicRequest) => api.post("/api/inquiries", data),
    onSuccess: () => {
      toast.success("Inquiry submitted successfully!");
    },
    onError: () => {
      toast.error("Failed to submit inquiry.");
    },
  });
}
