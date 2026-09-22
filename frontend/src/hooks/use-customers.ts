"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useActiveBusiness } from "./use-active-business";
import { toast } from "sonner";
import type { CustomerResponse, CreateCustomerRequest } from "@/lib/types";
const map = (c: any): CustomerResponse => ({ id: c._id, name: c.name, phoneNumber: c.phoneNumber, email: c.email, notes: c.notes });
export function useCustomers() { const { businessId } = useActiveBusiness(); const data = useQuery(api.customers.list, businessId ? { businessId } : "skip"); return { data: data?.map(map), isLoading: data === undefined, isError: false }; }
export function useCreateCustomer() { const create = useMutation(api.customers.create); const { businessId } = useActiveBusiness(); return { mutateAsync: async (data: CreateCustomerRequest) => { if (!businessId) throw new Error("Business session not found"); try { return await create({ businessId, ...data }); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to create customer."); throw e; } }, isPending: false }; }
