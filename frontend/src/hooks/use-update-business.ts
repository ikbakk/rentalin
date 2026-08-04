"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { BusinessResponse, UpdateBusinessRequest } from "@/lib/types";

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateBusinessRequest) =>
      api.put<BusinessResponse>(`/api/businesses/${request.id}`, request),
    onSuccess: (_data, request) => {
      queryClient.invalidateQueries({ queryKey: ["business", request.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to update business");
    },
  });
}
