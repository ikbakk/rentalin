"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { CustomerResponse, UpdateCustomerRequest } from "@/lib/types";

export function useCustomerById(id: string) {
  return useQuery<CustomerResponse>({
    queryKey: ["customer", id],
    queryFn: () => api.get(`/api/customers/${id}`),
    enabled: !!id,
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateCustomerRequest & { id: string }) =>
      api.put<CustomerResponse>(`/api/customers/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated");
    },
    onError: () => {
      toast.error("Failed to update customer.");
    },
  });
}

export interface UpdateCustomerRequest {
  name: string;
  phoneNumber: string;
  email: string;
  notes?: string;
}
