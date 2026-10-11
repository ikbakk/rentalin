"use client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useActiveBusiness } from "./use-active-business";
export function useOperationsSummary() { const { businessId } = useActiveBusiness(); const data = useQuery(api.dashboard.summary, businessId ? { businessId } : "skip"); const finance = useQuery(api.finance.summaryByBusiness, businessId ? { businessId } : "skip"); return { data: data && finance ? { ...data, todayPayments: finance.todayPayments, currency: finance.currency } : undefined, isLoading: data === undefined || finance === undefined, isError: false }; }
