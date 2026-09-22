"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { CustomerResponse, CreateCustomerRequest } from "@/lib/types";

const mapCustomer = (customer: any): CustomerResponse => ({
  id: customer._id,
  name: customer.name,
  phoneNumber: customer.phoneNumber,
  email: customer.email,
  notes: customer.notes,
});

export function useCustomers() {
  const externalId = getAuth()?.businessId;
  const customers = useQuery(api.customers.list, externalId ? { externalId } : "skip");
  return { data: customers?.map(mapCustomer), isLoading: customers === undefined, isError: false };
}

export function useCreateCustomer() {
  const create = useMutation(api.customers.create);
  return {
    mutateAsync: async (data: CreateCustomerRequest) => {
      const externalId = getAuth()?.businessId;
      if (!externalId) throw new Error("Business session not found");
      try { return await create({ externalId, ...data }); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Failed to create customer."); throw error; }
    },
    isPending: false,
  };
}
