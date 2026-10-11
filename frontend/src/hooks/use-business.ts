"use client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { BusinessResponse } from "@/lib/types";
import { resolveBusinessTimeZone } from "@/lib/business-time";
export function useBusiness() { const business = useQuery(api.tenancy.activeBusiness, {}); return { data: business ? ({ id: business._id, name: business.name, address: business.address ?? "", phoneNumber: business.phone ?? "", email: business.email ?? "", logoUrl: business.logoUrl, slug: business.slug, timeZone: resolveBusinessTimeZone(business.timeZone) } satisfies BusinessResponse) : undefined, isLoading: business === undefined }; }
