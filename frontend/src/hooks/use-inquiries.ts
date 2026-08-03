"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { InquiryResponse, CreateInquiryRequest } from "@/lib/types";

export function useInquiries() {
  return useQuery<InquiryResponse[]>({
    queryKey: ["inquiries"],
    queryFn: () => api.get("/api/inquiries"),
  });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInquiryRequest) => api.post("/api/inquiries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => {
      toast.error("Failed to create inquiry.");
    },
  });
}

export function useConfirmInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/inquiries/${id}/confirm`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inquiries"] }),
    onError: () => {
      toast.error("Failed to confirm inquiry.");
    },
  });
}
