"use client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useActiveBusiness } from "./use-active-business";
export function useOperationsSummary() { const { businessId } = useActiveBusiness(); const data = useQuery(api.dashboard.summary, businessId ? { businessId } : "skip"); return { data, isLoading: data === undefined, isError: false }; }
