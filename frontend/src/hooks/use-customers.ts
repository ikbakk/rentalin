"use client";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import { useActiveBusiness } from "./use-active-business";
import { usePendingMutation } from "./use-pending-mutation";
import type { CustomerResponse, CreateCustomerRequest } from "@/lib/types";
type CustomerRecord = FunctionReturnType<typeof api.customers.list>[number];
const map = (c: CustomerRecord): CustomerResponse => ({ id: c._id, name: c.name, phoneNumber: c.phoneNumber, email: c.email, notes: c.notes });
export function useCustomers() { const { businessId } = useActiveBusiness(); const data = useQuery(api.customers.list, businessId ? { businessId } : "skip"); return { data: data?.map(map), isLoading: data === undefined }; }
export function useCreateCustomer() { const create = useMutation(api.customers.create); const { businessId } = useActiveBusiness(); return usePendingMutation(async (data: CreateCustomerRequest) => { if (!businessId) throw new Error("Business session not found"); return create({ businessId, ...data }); }); }
