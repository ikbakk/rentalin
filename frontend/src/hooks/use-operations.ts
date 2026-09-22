"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getAuth } from "@/lib/auth";

export function useOperationsSummary() {
  const externalId = getAuth()?.businessId;
  const data = useQuery(api.dashboard.summary, externalId ? { externalId } : "skip");
  return { data, isLoading: data === undefined, isError: false };
}
