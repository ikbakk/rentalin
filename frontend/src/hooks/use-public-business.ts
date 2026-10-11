"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { resolveBusinessTimeZone } from "@/lib/business-time";

export interface PublicBusiness {
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
  timeZone: string;
}

export function usePublicBusiness(slug: string) {
  const business = useQuery(api.public.businessBySlug, slug ? { slug } : "skip");
  return {
    data: business
      ? {
          name: business.name,
          slug: business.slug,
          address: business.address ?? "",
          phone: business.phone ?? "",
          email: business.email ?? "",
          logoUrl: business.logoUrl ?? null,
          timeZone: resolveBusinessTimeZone(business.timeZone),
        }
      : undefined,
    isLoading: business === undefined,
    isError: false,
  };
}
