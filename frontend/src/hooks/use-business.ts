"use client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { BusinessResponse } from "@/lib/types";
export function useBusiness(_businessId?: string) { const business = useQuery(api.tenancy.activeBusiness, {}); return { data: business ? ({ id: business._id, name: business.name, address: business.address ?? "", phoneNumber: business.phone ?? "", email: business.email ?? "", logoUrl: business.logoUrl, slug: business.slug } satisfies BusinessResponse) : undefined, isLoading: business === undefined, isError: false }; }
