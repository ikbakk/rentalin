"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import type { CustomerResponse, CreateCustomerRequest } from "@/lib/types"

export function useCustomers() {
  return useQuery<CustomerResponse[]>({
    queryKey: ["customers"],
    queryFn: () => api.get("/api/customers"),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => api.post<CustomerResponse>("/api/customers", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
    onError: () => {
      toast.error("Failed to create customer.")
    },
  })
}
