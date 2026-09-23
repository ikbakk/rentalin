"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";

export function useActiveBusiness() {
  const business = useQuery(api.tenancy.activeBusiness, {});
  const ensureOnboarded = useMutation(api.tenancy.ensureOnboarded);
  useEffect(() => { if (business === null) void ensureOnboarded({}); }, [business, ensureOnboarded]);
  return { business, businessId: business?._id, isLoading: business === undefined };
}

export function useBusinesses() { return useQuery(api.tenancy.myBusinesses, {}); }
export function useSelectBusiness() { return useMutation(api.tenancy.selectBusiness); }
