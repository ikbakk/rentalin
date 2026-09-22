/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/rules-of-hooks */
"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import type { CustomerResponse } from "@/lib/types";

const mapCustomer = (customer: any): CustomerResponse | undefined => customer && ({
  id: customer._id,
  name: customer.name,
  phoneNumber: customer.phoneNumber,
  email: customer.email,
  notes: customer.notes,
});

export function useCustomerById(id: string) {
  const customer = useQuery(api.customers.get, id ? { id: id as Id<"customers"> } : "skip");
  return { data: mapCustomer(customer), isLoading: customer === undefined, isError: false };
}

export interface UpdateCustomerRequest {
  name: string;
  phoneNumber: string;
  email: string;
  notes?: string;
}

export function useUpdateCustomer() {
  const update = useMutation(api.customers.update);
  return {
    mutate: ({ id, ...data }: UpdateCustomerRequest & { id: string }) => update({ id: id as Id<"customers">, ...data }),
    mutateAsync: async ({ id, ...data }: UpdateCustomerRequest & { id: string }) => {
      try { return await update({ id: id as Id<"customers">, ...data }); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Failed to update customer."); throw error; }
    },
    isPending: false,
  };
}
